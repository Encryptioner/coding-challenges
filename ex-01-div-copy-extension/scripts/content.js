/**
 * Content Script for DivCopy Extension
 * Handles element detection, selection, and copying on both desktop and mobile
 */

(function() {
  'use strict';

  // State management
  let mobileMode = false;
  let hoveredElement = null;
  let longPressTimer = null;
  let touchStartTime = 0;
  const LONG_PRESS_DURATION = 500; // 500ms for long press

  // Initialize
  init();

  function init() {
    console.log('DivCopy: Content script loaded');

    // Load mobile mode setting
    chrome.storage.local.get(['mobileMode'], (result) => {
      mobileMode = result.mobileMode || false;
      if (mobileMode) {
        enableMobileMode();
      }
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleMessage);

    // Desktop: Track hovered element
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);

    // Mobile: Touch event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchCancel);
  }

  /**
   * Handle messages from background script
   */
  function handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'copyText':
        copyElementContent('text');
        break;
      case 'copyHTML':
        copyElementContent('html');
        break;
      case 'copyStyled':
        copyElementContent('styled');
        break;
      case 'copySelector':
        copyElementContent('selector');
        break;
      case 'toggleMobileMode':
        mobileMode = message.enabled;
        if (mobileMode) {
          enableMobileMode();
        } else {
          disableMobileMode();
        }
        showToast(`Mobile mode ${mobileMode ? 'enabled' : 'disabled'}`);
        break;
    }
    return true;
  }

  /**
   * Desktop: Mouse over handler
   */
  function handleMouseOver(e) {
    if (!mobileMode && e.target !== document.body) {
      hoveredElement = e.target;
      highlightElement(e.target);
    }
  }

  /**
   * Desktop: Mouse out handler
   */
  function handleMouseOut(e) {
    if (!mobileMode) {
      unhighlightElement(e.target);
    }
  }

  /**
   * Mobile: Touch start handler
   */
  function handleTouchStart(e) {
    if (!mobileMode) return;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element !== document.body) {
      hoveredElement = element;
      touchStartTime = Date.now();

      // Start long press timer
      longPressTimer = setTimeout(() => {
        showMobileCopyMenu(element, touch.clientX, touch.clientY);
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, LONG_PRESS_DURATION);

      highlightElement(element);
    }
  }

  /**
   * Mobile: Touch end handler
   */
  function handleTouchEnd(e) {
    if (!mobileMode) return;

    clearTimeout(longPressTimer);

    // If it was a quick tap (not long press), remove highlight
    if (Date.now() - touchStartTime < LONG_PRESS_DURATION) {
      if (hoveredElement) {
        unhighlightElement(hoveredElement);
      }
    }
  }

  /**
   * Mobile: Touch cancel handler
   */
  function handleTouchCancel(e) {
    if (!mobileMode) return;

    clearTimeout(longPressTimer);
    if (hoveredElement) {
      unhighlightElement(hoveredElement);
    }
  }

  /**
   * Highlight element with visual feedback
   */
  function highlightElement(element) {
    if (!element || element.classList.contains('divcopy-highlighted')) return;

    element.classList.add('divcopy-highlighted');
    element.setAttribute('data-divcopy-original-outline', element.style.outline || '');
  }

  /**
   * Remove highlight from element
   */
  function unhighlightElement(element) {
    if (!element) return;

    element.classList.remove('divcopy-highlighted');
    const originalOutline = element.getAttribute('data-divcopy-original-outline');
    if (originalOutline !== null) {
      element.style.outline = originalOutline;
      element.removeAttribute('data-divcopy-original-outline');
    }
  }

  /**
   * Show mobile copy menu (floating action buttons)
   */
  function showMobileCopyMenu(element, x, y) {
    // Remove existing menu if any
    removeMobileCopyMenu();

    const menu = document.createElement('div');
    menu.id = 'divcopy-mobile-menu';
    menu.className = 'divcopy-mobile-menu';

    // Position near touch point
    menu.style.left = `${x}px`;
    menu.style.top = `${y - 60}px`;

    // Create action buttons
    const actions = [
      { icon: '📄', label: 'Text', type: 'text' },
      { icon: '🔖', label: 'HTML', type: 'html' },
      { icon: '🎨', label: 'Styled', type: 'styled' },
      { icon: '🎯', label: 'Selector', type: 'selector' },
      { icon: '✖', label: 'Close', type: 'close' }
    ];

    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = 'divcopy-mobile-btn';
      button.innerHTML = `${action.icon}<span>${action.label}</span>`;
      button.onclick = () => {
        if (action.type === 'close') {
          removeMobileCopyMenu();
          unhighlightElement(hoveredElement);
        } else {
          copyElementContent(action.type, element);
          removeMobileCopyMenu();
          unhighlightElement(element);
        }
      };
      menu.appendChild(button);
    });

    document.body.appendChild(menu);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeMobileCopyMenu();
      unhighlightElement(element);
    }, 5000);
  }

  /**
   * Remove mobile copy menu
   */
  function removeMobileCopyMenu() {
    const existingMenu = document.getElementById('divcopy-mobile-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
  }

  /**
   * Copy element content in specified format
   */
  function copyElementContent(type, targetElement = null) {
    const element = targetElement || hoveredElement;

    if (!element) {
      showToast('No element selected');
      return;
    }

    let content = '';

    switch (type) {
      case 'text':
        content = getElementText(element);
        break;
      case 'html':
        content = element.outerHTML;
        break;
      case 'styled':
        content = getStyledHTML(element);
        break;
      case 'selector':
        content = getCSSSelector(element);
        break;
      default:
        content = element.textContent || '';
    }

    if (content) {
      copyToClipboard(content, type);
    } else {
      showToast('No content to copy');
    }
  }

  /**
   * Get element text content (cleaned)
   */
  function getElementText(element) {
    return element.textContent?.trim() || '';
  }

  /**
   * Get HTML with inline styles
   */
  function getStyledHTML(element) {
    const clone = element.cloneNode(true);

    // Apply computed styles inline
    const applyStyles = (original, cloned) => {
      const styles = window.getComputedStyle(original);
      let styleStr = '';

      // Copy important styles
      const importantProps = [
        'display', 'position', 'width', 'height',
        'margin', 'padding', 'border', 'background',
        'color', 'font-size', 'font-family', 'font-weight',
        'text-align', 'line-height'
      ];

      importantProps.forEach(prop => {
        const value = styles.getPropertyValue(prop);
        if (value) {
          styleStr += `${prop}: ${value}; `;
        }
      });

      if (styleStr) {
        cloned.setAttribute('style', styleStr);
      }

      // Recursively apply to children
      for (let i = 0; i < original.children.length; i++) {
        applyStyles(original.children[i], cloned.children[i]);
      }
    };

    applyStyles(element, clone);
    return clone.outerHTML;
  }

  /**
   * Generate CSS selector for element
   */
  function getCSSSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = Array.from(element.classList)
        .filter(c => !c.startsWith('divcopy-'))
        .join('.');
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`;
      }
    }

    // Build path from body
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
  }

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text, type) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`✓ Copied as ${type}!`);

      // Notify background script
      chrome.runtime.sendMessage({
        action: 'copySuccess',
        type: type,
        length: text.length
      });
    } catch (err) {
      console.error('DivCopy: Failed to copy:', err);

      // Fallback method
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        showToast(`✓ Copied as ${type}!`);
      } catch (fallbackErr) {
        showToast('✗ Failed to copy');
        console.error('DivCopy: Fallback copy failed:', fallbackErr);
      }

      document.body.removeChild(textarea);
    }
  }

  /**
   * Show toast notification
   */
  function showToast(message, duration = 2000) {
    // Remove existing toast
    const existingToast = document.getElementById('divcopy-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'divcopy-toast';
    toast.className = 'divcopy-toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('divcopy-toast-show'), 10);

    // Auto-remove
    setTimeout(() => {
      toast.classList.remove('divcopy-toast-show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Enable mobile mode
   */
  function enableMobileMode() {
    document.body.classList.add('divcopy-mobile-mode');
  }

  /**
   * Disable mobile mode
   */
  function disableMobileMode() {
    document.body.classList.remove('divcopy-mobile-mode');
    removeMobileCopyMenu();
  }

})();
