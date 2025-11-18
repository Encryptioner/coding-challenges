/**
 * TextCopy - Standalone JavaScript Library
 * Copy content from any element on any website
 *
 * Usage:
 *   <script src="textcopy.min.js"></script>
 *   <script>TextCopy.init();</script>
 *
 * Or with options:
 *   <script>
 *     TextCopy.init({
 *       mode: 'auto',           // 'auto', 'desktop', 'mobile'
 *       showTooltips: true,
 *       copyFormat: 'text',     // 'text', 'html', 'styled', 'selector'
 *       highlightColor: '#4CAF50'
 *     });
 *   </script>
 *
 * Version: 1.0.0
 * License: MIT
 * Website: https://github.com/your-repo/textcopy
 */

(function(window, document) {
  'use strict';

  // Prevent multiple initializations
  if (window.TextCopy) {
    console.warn('TextCopy already initialized');
    return;
  }

  // Default configuration
  const defaultConfig = {
    mode: 'auto',                // 'auto', 'desktop', 'mobile'
    showTooltips: true,
    copyFormat: 'text',          // 'text', 'html', 'styled', 'selector'
    highlightColor: '#4CAF50',
    longPressDuration: 500,      // milliseconds
    toastDuration: 2000,         // milliseconds
    mobileBreakpoint: 768,       // pixels
    enableStats: false,
    onCopy: null,                // callback function
    excludeSelectors: [],        // elements to exclude
    autoInit: false
  };

  // Current configuration
  let config = { ...defaultConfig };

  // State
  let isInitialized = false;
  let isMobileMode = false;
  let hoveredElement = null;
  let longPressTimer = null;
  let touchStartTime = 0;
  let stats = {
    totalCopies: 0,
    sessionCopies: 0
  };

  /**
   * Main TextCopy object
   */
  const TextCopy = {
    version: '1.0.0',

    /**
     * Initialize TextCopy
     * @param {Object} options - Configuration options
     */
    init: function(options = {}) {
      if (isInitialized) {
        console.warn('TextCopy already initialized');
        return;
      }

      // Merge options with defaults
      config = { ...defaultConfig, ...options };

      // Detect mode
      if (config.mode === 'auto') {
        isMobileMode = this.isMobileDevice();
      } else {
        isMobileMode = config.mode === 'mobile';
      }

      // Inject CSS
      this.injectStyles();

      // Setup event listeners
      this.setupEventListeners();

      // Load stats
      if (config.enableStats) {
        this.loadStats();
      }

      isInitialized = true;
      console.log('TextCopy initialized (mode:', isMobileMode ? 'mobile' : 'desktop', ')');
    },

    /**
     * Detect if device is mobile
     * @returns {boolean}
     */
    isMobileDevice: function() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
             || window.innerWidth <= config.mobileBreakpoint;
    },

    /**
     * Inject CSS styles into document
     */
    injectStyles: function() {
      if (document.getElementById('textcopy-styles')) return;

      const style = document.createElement('style');
      style.id = 'textcopy-styles';
      style.textContent = `
        /* TextCopy Styles */
        .textcopy-highlighted {
          outline: 3px solid ${config.highlightColor} !important;
          outline-offset: 2px !important;
          position: relative !important;
          cursor: copy !important;
          transition: outline 0.2s ease !important;
        }

        .textcopy-highlighted::after {
          content: '📋 ${isMobileMode ? 'Long press' : 'Right-click'} to copy';
          position: absolute;
          top: -30px;
          left: 0;
          background: ${config.highlightColor};
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          white-space: nowrap;
          z-index: 999999;
          pointer-events: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          display: ${config.showTooltips ? 'block' : 'none'};
        }

        .textcopy-menu {
          position: fixed;
          z-index: 9999999;
          background: white;
          border-radius: 12px;
          padding: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
          display: none;
          gap: 6px;
        }

        .textcopy-menu.textcopy-show {
          display: flex;
          animation: textcopy-pop 0.2s ease forwards;
        }

        @keyframes textcopy-pop {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .textcopy-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          border: none;
          border-radius: 8px;
          padding: 12px;
          min-width: 60px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        .textcopy-btn:hover, .textcopy-btn:active {
          background: #e0e0e0;
          transform: scale(0.95);
        }

        .textcopy-btn span {
          font-size: 10px;
          margin-top: 4px;
          color: #333;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          font-weight: 500;
        }

        .textcopy-btn.textcopy-close {
          background: #ff5252;
        }

        .textcopy-btn.textcopy-close span {
          color: white;
        }

        .textcopy-toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 12px 24px;
          border-radius: 24px;
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          z-index: 99999999;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          pointer-events: none;
          backdrop-filter: blur(10px);
        }

        .textcopy-toast.textcopy-show {
          transform: translateX(-50%) translateY(0);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .textcopy-menu {
            padding: 6px;
            gap: 4px;
          }

          .textcopy-btn {
            min-width: 50px;
            padding: 10px;
            font-size: 18px;
          }

          .textcopy-btn span {
            font-size: 9px;
          }

          .textcopy-toast {
            bottom: 80px;
            font-size: 13px;
            padding: 10px 20px;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .textcopy-menu {
            background: #2d2d2d;
          }

          .textcopy-btn {
            background: #3d3d3d;
          }

          .textcopy-btn:hover, .textcopy-btn:active {
            background: #4d4d4d;
          }

          .textcopy-btn span {
            color: #f5f5f5;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .textcopy-highlighted {
            outline-width: 4px !important;
          }

          .textcopy-menu {
            border: 2px solid #000;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .textcopy-highlighted,
          .textcopy-btn,
          .textcopy-toast,
          .textcopy-menu {
            animation: none !important;
            transition: none !important;
          }
        }
      `;

      document.head.appendChild(style);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners: function() {
      if (isMobileMode) {
        // Mobile: touch events
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
      } else {
        // Desktop: mouse events
        document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
        document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
        document.addEventListener('contextmenu', this.handleContextMenu.bind(this), true);
      }

      // Click outside to close menu
      document.addEventListener('click', this.handleClickOutside.bind(this));
    },

    /**
     * Check if element should be excluded
     * @param {Element} element
     * @returns {boolean}
     */
    shouldExclude: function(element) {
      if (!element || element === document.body || element === document.documentElement) {
        return true;
      }

      // Check exclude selectors
      for (const selector of config.excludeSelectors) {
        if (element.matches(selector)) {
          return true;
        }
      }

      // Exclude TextCopy's own elements
      if (element.closest('.textcopy-menu') || element.closest('.textcopy-toast')) {
        return true;
      }

      return false;
    },

    /**
     * Mouse over handler (desktop)
     */
    handleMouseOver: function(e) {
      if (this.shouldExclude(e.target)) return;
      hoveredElement = e.target;
      this.highlightElement(e.target);
    },

    /**
     * Mouse out handler (desktop)
     */
    handleMouseOut: function(e) {
      if (this.shouldExclude(e.target)) return;
      this.unhighlightElement(e.target);
    },

    /**
     * Context menu handler (desktop)
     */
    handleContextMenu: function(e) {
      if (this.shouldExclude(e.target)) return;

      // Don't prevent default, but prepare for copy
      hoveredElement = e.target;

      // Create our own context menu
      e.preventDefault();
      this.showCopyMenu(e.target, e.pageX, e.pageY);
    },

    /**
     * Touch start handler (mobile)
     */
    handleTouchStart: function(e) {
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      if (this.shouldExclude(element)) return;

      hoveredElement = element;
      touchStartTime = Date.now();

      // Start long press timer
      longPressTimer = setTimeout(() => {
        this.showCopyMenu(element, touch.pageX, touch.pageY);

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, config.longPressDuration);

      this.highlightElement(element);
    },

    /**
     * Touch end handler (mobile)
     */
    handleTouchEnd: function(e) {
      clearTimeout(longPressTimer);

      // If quick tap, remove highlight
      if (Date.now() - touchStartTime < config.longPressDuration) {
        if (hoveredElement) {
          this.unhighlightElement(hoveredElement);
        }
      }
    },

    /**
     * Touch cancel handler (mobile)
     */
    handleTouchCancel: function(e) {
      clearTimeout(longPressTimer);
      if (hoveredElement) {
        this.unhighlightElement(hoveredElement);
      }
    },

    /**
     * Click outside handler
     */
    handleClickOutside: function(e) {
      const menu = document.getElementById('textcopy-menu');
      if (menu && !menu.contains(e.target)) {
        this.hideCopyMenu();
      }
    },

    /**
     * Highlight element
     */
    highlightElement: function(element) {
      if (!element || element.classList.contains('textcopy-highlighted')) return;
      element.classList.add('textcopy-highlighted');
    },

    /**
     * Unhighlight element
     */
    unhighlightElement: function(element) {
      if (!element) return;
      element.classList.remove('textcopy-highlighted');
    },

    /**
     * Show copy menu
     */
    showCopyMenu: function(element, x, y) {
      this.hideCopyMenu(); // Remove existing

      const menu = document.createElement('div');
      menu.id = 'textcopy-menu';
      menu.className = 'textcopy-menu textcopy-show';
      menu.style.left = `${x}px`;
      menu.style.top = `${y - 70}px`;

      const actions = [
        { icon: '📄', label: 'Text', type: 'text' },
        { icon: '🔖', label: 'HTML', type: 'html' },
        { icon: '🎨', label: 'Styled', type: 'styled' },
        { icon: '🎯', label: 'Selector', type: 'selector' },
        { icon: '✖', label: 'Close', type: 'close', className: 'textcopy-close' }
      ];

      actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'textcopy-btn' + (action.className ? ' ' + action.className : '');
        button.innerHTML = `${action.icon}<span>${action.label}</span>`;
        button.onclick = () => {
          if (action.type === 'close') {
            this.hideCopyMenu();
            this.unhighlightElement(element);
          } else {
            this.copyContent(element, action.type);
            this.hideCopyMenu();
            this.unhighlightElement(element);
          }
        };
        menu.appendChild(button);
      });

      document.body.appendChild(menu);

      // Auto-hide after 10 seconds
      setTimeout(() => {
        this.hideCopyMenu();
        this.unhighlightElement(element);
      }, 10000);
    },

    /**
     * Hide copy menu
     */
    hideCopyMenu: function() {
      const menu = document.getElementById('textcopy-menu');
      if (menu) {
        menu.remove();
      }
    },

    /**
     * Copy content
     */
    copyContent: function(element, format) {
      if (!element) return;

      let content = '';

      switch (format) {
        case 'text':
          content = element.textContent?.trim() || '';
          break;
        case 'html':
          content = element.outerHTML;
          break;
        case 'styled':
          content = this.getStyledHTML(element);
          break;
        case 'selector':
          content = this.getCSSSelector(element);
          break;
        default:
          content = element.textContent?.trim() || '';
      }

      this.copyToClipboard(content, format);
    },

    /**
     * Get styled HTML
     */
    getStyledHTML: function(element) {
      const clone = element.cloneNode(true);
      const styles = window.getComputedStyle(element);

      let styleStr = '';
      const props = ['display', 'position', 'width', 'height', 'margin', 'padding',
                     'border', 'background', 'color', 'font-size', 'font-family',
                     'font-weight', 'text-align', 'line-height'];

      props.forEach(prop => {
        const value = styles.getPropertyValue(prop);
        if (value) {
          styleStr += `${prop}: ${value}; `;
        }
      });

      if (styleStr) {
        clone.setAttribute('style', styleStr);
      }

      return clone.outerHTML;
    },

    /**
     * Get CSS selector
     */
    getCSSSelector: function(element) {
      if (element.id) {
        return `#${element.id}`;
      }

      if (element.className) {
        const classes = Array.from(element.classList)
          .filter(c => !c.startsWith('textcopy-'))
          .join('.');
        if (classes) {
          return `${element.tagName.toLowerCase()}.${classes}`;
        }
      }

      const path = [];
      let current = element;

      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();

        if (current.id) {
          selector += `#${current.id}`;
          path.unshift(selector);
          break;
        } else {
          const parent = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(
              e => e.tagName === current.tagName
            );
            if (siblings.length > 1) {
              const index = siblings.indexOf(current) + 1;
              selector += `:nth-of-type(${index})`;
            }
          }
        }

        path.unshift(selector);
        current = current.parentElement;
      }

      return path.join(' > ');
    },

    /**
     * Copy to clipboard
     */
    copyToClipboard: async function(text, format) {
      try {
        await navigator.clipboard.writeText(text);
        this.showToast(`✓ Copied as ${format}!`);
        this.incrementStats();

        // Callback
        if (typeof config.onCopy === 'function') {
          config.onCopy({ format, content: text, length: text.length });
        }
      } catch (err) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
          document.execCommand('copy');
          this.showToast(`✓ Copied as ${format}!`);
          this.incrementStats();
        } catch (fallbackErr) {
          this.showToast('✗ Failed to copy');
        }

        document.body.removeChild(textarea);
      }
    },

    /**
     * Show toast notification
     */
    showToast: function(message) {
      const existingToast = document.getElementById('textcopy-toast');
      if (existingToast) {
        existingToast.remove();
      }

      const toast = document.createElement('div');
      toast.id = 'textcopy-toast';
      toast.className = 'textcopy-toast';
      toast.textContent = message;

      document.body.appendChild(toast);

      setTimeout(() => toast.classList.add('textcopy-show'), 10);

      setTimeout(() => {
        toast.classList.remove('textcopy-show');
        setTimeout(() => toast.remove(), 300);
      }, config.toastDuration);
    },

    /**
     * Increment statistics
     */
    incrementStats: function() {
      stats.totalCopies++;
      stats.sessionCopies++;

      if (config.enableStats) {
        this.saveStats();
      }
    },

    /**
     * Load statistics
     */
    loadStats: function() {
      try {
        const saved = localStorage.getItem('textcopy-stats');
        if (saved) {
          const parsed = JSON.parse(saved);
          stats.totalCopies = parsed.totalCopies || 0;
        }
      } catch (e) {
        console.error('TextCopy: Failed to load stats', e);
      }
    },

    /**
     * Save statistics
     */
    saveStats: function() {
      try {
        localStorage.setItem('textcopy-stats', JSON.stringify({
          totalCopies: stats.totalCopies
        }));
      } catch (e) {
        console.error('TextCopy: Failed to save stats', e);
      }
    },

    /**
     * Get current statistics
     */
    getStats: function() {
      return { ...stats };
    },

    /**
     * Destroy TextCopy
     */
    destroy: function() {
      // Remove styles
      const styles = document.getElementById('textcopy-styles');
      if (styles) styles.remove();

      // Remove menu
      this.hideCopyMenu();

      // Remove toast
      const toast = document.getElementById('textcopy-toast');
      if (toast) toast.remove();

      // Remove highlights
      document.querySelectorAll('.textcopy-highlighted').forEach(el => {
        el.classList.remove('textcopy-highlighted');
      });

      // Remove event listeners (would need to store references to remove properly)
      // For simplicity, just reload the page if destroy is needed

      isInitialized = false;
      console.log('TextCopy destroyed');
    }
  };

  // Expose to window
  window.TextCopy = TextCopy;

  // Auto-init if specified
  if (defaultConfig.autoInit) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => TextCopy.init());
    } else {
      TextCopy.init();
    }
  }

})(window, document);
