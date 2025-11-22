/**
 * DivCopy Popup Script
 * Handles settings, statistics, and user interactions
 */

// DOM elements
const mobileMode Toggle = document.getElementById('mobile-mode');
const autoHighlightToggle = document.getElementById('auto-highlight');
const showTooltipsToggle = document.getElementById('show-tooltips');
const defaultFormatSelect = document.getElementById('default-format');
const testCopyBtn = document.getElementById('test-copy');
const clearCacheBtn = document.getElementById('clear-cache');
const copyCountEl = document.getElementById('copy-count');
const totalCopiesEl = document.getElementById('total-copies');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  loadSettings();
  loadStats();
  setupEventListeners();
}

/**
 * Load saved settings from storage
 */
function loadSettings() {
  chrome.storage.local.get(
    ['mobileMode', 'autoHighlight', 'showTooltips', 'defaultFormat'],
    (result) => {
      mobileModeToggle.checked = result.mobileMode || false;
      autoHighlightToggle.checked = result.autoHighlight !== false; // default true
      showTooltipsToggle.checked = result.showTooltips !== false; // default true
      defaultFormatSelect.value = result.defaultFormat || 'text';
    }
  );
}

/**
 * Load statistics from storage
 */
function loadStats() {
  chrome.storage.local.get(['copyCountToday', 'totalCopies', 'lastResetDate'], (result) => {
    const today = new Date().toDateString();
    let copyCountToday = result.copyCountToday || 0;

    // Reset daily count if it's a new day
    if (result.lastResetDate !== today) {
      copyCountToday = 0;
      chrome.storage.local.set({
        copyCountToday: 0,
        lastResetDate: today
      });
    }

    copyCountEl.textContent = copyCountToday;
    totalCopiesEl.textContent = result.totalCopies || 0;
  });
}

/**
 * Setup event listeners for all controls
 */
function setupEventListeners() {
  // Mobile mode toggle
  mobileModeToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ mobileMode: enabled });

    // Update context menu
    chrome.contextMenus.update('divcopy-toggle-mobile', {
      checked: enabled
    });

    // Notify content script
    sendToActiveTab({ action: 'toggleMobileMode', enabled });

    showToast(`Mobile mode ${enabled ? 'enabled' : 'disabled'}`);
  });

  // Auto highlight toggle
  autoHighlightToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ autoHighlight: enabled });
    sendToActiveTab({ action: 'setAutoHighlight', enabled });
    showToast(`Auto highlight ${enabled ? 'enabled' : 'disabled'}`);
  });

  // Show tooltips toggle
  showTooltipsToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ showTooltips: enabled });
    sendToActiveTab({ action: 'setShowTooltips', enabled });
    showToast(`Tooltips ${enabled ? 'enabled' : 'disabled'}`);
  });

  // Default format select
  defaultFormatSelect.addEventListener('change', (e) => {
    const format = e.target.value;
    chrome.storage.local.set({ defaultFormat: format });
    showToast(`Default format: ${format}`);
  });

  // Test copy button
  testCopyBtn.addEventListener('click', testCopyFunction);

  // Clear cache button
  clearCacheBtn.addEventListener('click', clearCache);

  // Footer links
  document.getElementById('help-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: 'https://github.com/your-repo/ex-div-copy-extension#usage'
    });
  });

  document.getElementById('feedback-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: 'https://github.com/your-repo/ex-div-copy-extension/issues'
    });
  });

  document.getElementById('about-link').addEventListener('click', (e) => {
    e.preventDefault();
    showAboutDialog();
  });
}

/**
 * Send message to active tab
 */
function sendToActiveTab(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, message).catch((err) => {
        console.error('Error sending message:', err);
      });
    }
  });
}

/**
 * Test copy function
 */
function testCopyFunction() {
  const testText = 'DivCopy extension is working! ✓';

  navigator.clipboard.writeText(testText)
    .then(() => {
      showToast('✓ Test successful! Clipboard working.');

      // Increment stats
      updateStats();
    })
    .catch((err) => {
      showToast('✗ Test failed. Check permissions.');
      console.error('Test copy failed:', err);
    });
}

/**
 * Clear cache
 */
function clearCache() {
  if (confirm('Clear all statistics and cached data?')) {
    chrome.storage.local.clear(() => {
      // Reset to defaults
      chrome.storage.local.set({
        mobileMode: false,
        autoHighlight: true,
        showTooltips: true,
        defaultFormat: 'text',
        copyCountToday: 0,
        totalCopies: 0,
        lastResetDate: new Date().toDateString()
      });

      // Reload settings and stats
      loadSettings();
      loadStats();

      showToast('✓ Cache cleared!');
    });
  }
}

/**
 * Update statistics
 */
function updateStats() {
  chrome.storage.local.get(['copyCountToday', 'totalCopies', 'lastResetDate'], (result) => {
    const today = new Date().toDateString();
    let copyCountToday = result.copyCountToday || 0;
    let totalCopies = result.totalCopies || 0;

    // Reset daily count if new day
    if (result.lastResetDate !== today) {
      copyCountToday = 0;
    }

    copyCountToday++;
    totalCopies++;

    chrome.storage.local.set({
      copyCountToday,
      totalCopies,
      lastResetDate: today
    });

    copyCountEl.textContent = copyCountToday;
    totalCopiesEl.textContent = totalCopies;
  });
}

/**
 * Show toast notification
 */
function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.85);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 13px;
    z-index: 99999;
    animation: slideUp 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/**
 * Show about dialog
 */
function showAboutDialog() {
  const about = `
DivCopy v1.0.0

A Chrome extension for copying content from any element on any website.

Features:
• Right-click context menu (desktop)
• Long-press menu (mobile)
• Multiple copy formats
• CSS selector extraction
• Touch-friendly UI

Created as part of coding challenges.
  `.trim();

  alert(about);
}

// Add toast animations to document
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
  }
`;
document.head.appendChild(style);

// Listen for storage changes (from other instances)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.copyCountToday || changes.totalCopies) {
      loadStats();
    }
  }
});
