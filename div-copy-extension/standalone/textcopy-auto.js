/**
 * TextCopy - Auto Copy Buttons for Any Website
 * Add this script once, visitors get automatic copy buttons
 *
 * WEBSITE OWNER: Just add this script to your site
 * VISITORS: Automatically see copy buttons - no installation needed!
 *
 * Usage:
 *   <script src="textcopy.js"></script>
 *   <script>TextCopy.init();</script>
 *
 * That's it! Copy buttons appear automatically for your visitors.
 *
 * Version: 2.0.0
 * License: MIT
 */

(function(window, document) {
  'use strict';

  if (window.TextCopy) return;

  const defaultConfig = {
    // What elements get copy buttons
    autoTarget: 'p, pre, code, blockquote, h1, h2, h3, h4, h5, h6, li',

    // Button appearance
    buttonText: 'Copy',
    copiedText: '✓ Copied!',
    buttonPosition: 'top-right',  // 'top-right', 'top-left', 'inside'
    showOnHover: true,             // Show button only on hover

    // Styling
    buttonColor: '#4CAF50',
    buttonStyle: 'modern',         // 'modern', 'minimal', 'rounded'

    // Behavior
    copyFormat: 'text',            // 'text' or 'html'
    showToast: true,
    toastDuration: 2000,

    // Mobile
    mobileEnabled: true,
    mobileTapToCopy: false,        // Tap element directly to copy

    // Advanced
    excludeSelectors: [],
    onCopy: null
  };

  let config = { ...defaultConfig };
  let copiedElements = new Set();

  const TextCopy = {
    version: '2.0.0',

    init: function(options = {}) {
      config = { ...defaultConfig, ...options };

      this.injectStyles();
      this.setupAutoButtons();
      this.setupMobileSupport();

      console.log('✓ TextCopy activated - visitors can now copy content easily!');
    },

    injectStyles: function() {
      if (document.getElementById('textcopy-auto-styles')) return;

      const style = document.createElement('style');
      style.id = 'textcopy-auto-styles';
      style.textContent = `
        /* TextCopy Auto Buttons */
        .textcopy-container {
          position: relative;
        }

        .textcopy-btn {
          position: absolute;
          ${config.buttonPosition === 'top-right' ? 'top: 8px; right: 8px;' : ''}
          ${config.buttonPosition === 'top-left' ? 'top: 8px; left: 8px;' : ''}
          background: ${config.buttonColor};
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: ${config.buttonStyle === 'rounded' ? '20px' : '6px'};
          font-size: 13px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          ${config.showOnHover ? 'opacity: 0; pointer-events: none;' : 'opacity: 1;'}
          font-weight: 500;
          white-space: nowrap;
        }

        .textcopy-container:hover .textcopy-btn {
          opacity: 1;
          pointer-events: all;
        }

        .textcopy-btn:hover {
          background: ${this.darkenColor(config.buttonColor, -10)};
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .textcopy-btn:active {
          transform: translateY(0);
        }

        .textcopy-btn.textcopy-copied {
          background: #2196F3;
        }

        .textcopy-btn.textcopy-minimal {
          background: transparent;
          color: ${config.buttonColor};
          border: 1px solid ${config.buttonColor};
        }

        .textcopy-btn.textcopy-minimal:hover {
          background: ${config.buttonColor};
          color: white;
        }

        /* Toast notification */
        .textcopy-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 12px 24px;
          border-radius: 24px;
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          z-index: 999999;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          pointer-events: none;
        }

        .textcopy-toast.show {
          transform: translateX(-50%) translateY(0);
        }

        /* Mobile tap indicator */
        .textcopy-tap-hint {
          position: absolute;
          top: 4px;
          right: 4px;
          background: ${config.buttonColor};
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .textcopy-container:active .textcopy-tap-hint {
          opacity: 1;
        }

        /* Code block special styling */
        pre.textcopy-container {
          padding-top: 40px;
        }

        pre.textcopy-container .textcopy-btn {
          top: 8px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .textcopy-btn {
            padding: 8px 12px;
            font-size: 12px;
            ${config.showOnHover ? 'opacity: 0.7;' : ''}
          }

          .textcopy-container:hover .textcopy-btn,
          .textcopy-container:active .textcopy-btn {
            opacity: 1;
          }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .textcopy-btn {
            box-shadow: 0 2px 8px rgba(255,255,255,0.1);
          }
        }

        /* Print - hide buttons */
        @media print {
          .textcopy-btn,
          .textcopy-toast,
          .textcopy-tap-hint {
            display: none !important;
          }
        }
      `;

      document.head.appendChild(style);
    },

    setupAutoButtons: function() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.addCopyButtons());
      } else {
        this.addCopyButtons();
      }

      // Watch for dynamically added content
      const observer = new MutationObserver(() => {
        this.addCopyButtons();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    },

    addCopyButtons: function() {
      const elements = document.querySelectorAll(config.autoTarget);

      elements.forEach(element => {
        // Skip if already has button or is excluded
        if (element.classList.contains('textcopy-container')) return;
        if (this.shouldExclude(element)) return;
        if (!element.textContent?.trim()) return;

        // Mark as processed
        element.classList.add('textcopy-container');

        // Create copy button
        const button = document.createElement('button');
        button.className = 'textcopy-btn';
        if (config.buttonStyle === 'minimal') {
          button.classList.add('textcopy-minimal');
        }
        button.textContent = config.buttonText;
        button.setAttribute('aria-label', 'Copy to clipboard');
        button.type = 'button';

        // Click handler
        button.onclick = (e) => {
          e.stopPropagation();
          this.copyElement(element, button);
        };

        element.appendChild(button);

        // Mobile tap to copy (optional)
        if (config.mobileTapToCopy && this.isMobile()) {
          const hint = document.createElement('span');
          hint.className = 'textcopy-tap-hint';
          hint.textContent = 'Tap to copy';
          element.appendChild(hint);

          element.style.cursor = 'pointer';
          element.addEventListener('click', (e) => {
            if (e.target === element || element.contains(e.target)) {
              if (e.target !== button) {
                this.copyElement(element, button);
              }
            }
          });
        }
      });
    },

    copyElement: function(element, button) {
      const originalText = button.textContent;

      // Get content
      let content = '';
      if (config.copyFormat === 'html') {
        content = element.innerHTML;
      } else {
        content = element.textContent?.trim() || '';
      }

      // Copy to clipboard
      this.copyToClipboard(content).then(() => {
        // Update button
        button.textContent = config.copiedText;
        button.classList.add('textcopy-copied');

        // Reset after 2 seconds
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('textcopy-copied');
        }, 2000);

        // Show toast
        if (config.showToast) {
          this.showToast('Content copied to clipboard!');
        }

        // Callback
        if (typeof config.onCopy === 'function') {
          config.onCopy({
            content,
            length: content.length,
            element: element.tagName.toLowerCase()
          });
        }
      }).catch(() => {
        button.textContent = '✗ Failed';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      });
    },

    copyToClipboard: async function(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
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
          document.body.removeChild(textarea);
          return true;
        } catch (e) {
          document.body.removeChild(textarea);
          throw e;
        }
      }
    },

    showToast: function(message) {
      const existing = document.getElementById('textcopy-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'textcopy-toast';
      toast.className = 'textcopy-toast';
      toast.textContent = message;

      document.body.appendChild(toast);

      setTimeout(() => toast.classList.add('show'), 10);

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, config.toastDuration);
    },

    shouldExclude: function(element) {
      for (const selector of config.excludeSelectors) {
        if (element.matches(selector)) return true;
      }
      return element.closest('.textcopy-btn, .textcopy-toast, .textcopy-tap-hint');
    },

    isMobile: function() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
             || window.innerWidth <= 768;
    },

    darkenColor: function(color, percent) {
      // Simple color darkening
      const num = parseInt(color.replace('#',''), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
        (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
        .toString(16).slice(1);
    },

    setupMobileSupport: function() {
      if (!config.mobileEnabled) return;

      // Add touch-friendly styles for mobile
      if (this.isMobile()) {
        const mobileStyle = document.createElement('style');
        mobileStyle.textContent = `
          .textcopy-btn {
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .textcopy-container {
            -webkit-tap-highlight-color: transparent;
          }
        `;
        document.head.appendChild(mobileStyle);
      }
    }
  };

  window.TextCopy = TextCopy;

  // Auto-init if data attribute present
  if (document.currentScript?.hasAttribute('data-auto-init')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => TextCopy.init());
    } else {
      TextCopy.init();
    }
  }

})(window, document);
