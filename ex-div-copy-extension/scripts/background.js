/**
 * Background Service Worker for DivCopy Extension
 * Handles context menu creation and message passing
 */

// Create context menu on extension installation
chrome.runtime.onInstalled.addListener(() => {
  // Create parent menu item
  chrome.contextMenus.create({
    id: 'divcopy-parent',
    title: 'DivCopy',
    contexts: ['all']
  });

  // Copy as Plain Text
  chrome.contextMenus.create({
    id: 'divcopy-text',
    parentId: 'divcopy-parent',
    title: 'Copy as Text',
    contexts: ['all']
  });

  // Copy as HTML
  chrome.contextMenus.create({
    id: 'divcopy-html',
    parentId: 'divcopy-parent',
    title: 'Copy as HTML',
    contexts: ['all']
  });

  // Copy with Styles (CSS)
  chrome.contextMenus.create({
    id: 'divcopy-styled',
    parentId: 'divcopy-parent',
    title: 'Copy with Styles',
    contexts: ['all']
  });

  // Copy CSS Selector
  chrome.contextMenus.create({
    id: 'divcopy-selector',
    parentId: 'divcopy-parent',
    title: 'Copy CSS Selector',
    contexts: ['all']
  });

  // Separator
  chrome.contextMenus.create({
    id: 'divcopy-separator',
    parentId: 'divcopy-parent',
    type: 'separator',
    contexts: ['all']
  });

  // Toggle Mobile Mode
  chrome.contextMenus.create({
    id: 'divcopy-toggle-mobile',
    parentId: 'divcopy-parent',
    title: 'Enable Mobile Mode',
    contexts: ['all'],
    type: 'checkbox',
    checked: false
  });

  console.log('DivCopy: Context menus created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  const menuId = info.menuId;

  // Handle mobile mode toggle
  if (menuId === 'divcopy-toggle-mobile') {
    chrome.storage.local.set({ mobileMode: info.checked });

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'toggleMobileMode',
      enabled: info.checked
    });
    return;
  }

  // For copy actions, send message to content script
  const copyActions = {
    'divcopy-text': 'copyText',
    'divcopy-html': 'copyHTML',
    'divcopy-styled': 'copyStyled',
    'divcopy-selector': 'copySelector'
  };

  if (copyActions[menuId]) {
    chrome.tabs.sendMessage(tab.id, {
      action: copyActions[menuId],
      clickX: info.pageX,
      clickY: info.pageY
    }).catch(err => {
      console.error('DivCopy: Error sending message to content script:', err);
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showNotification') {
    // Could show a notification here if needed
    console.log('DivCopy:', message.message);
  }

  if (message.action === 'copySuccess') {
    // Track copy success
    console.log('DivCopy: Copied successfully:', message.type);
  }

  return true;
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Could toggle mobile mode or open popup
  chrome.storage.local.get(['mobileMode'], (result) => {
    const newMode = !result.mobileMode;
    chrome.storage.local.set({ mobileMode: newMode });

    chrome.tabs.sendMessage(tab.id, {
      action: 'toggleMobileMode',
      enabled: newMode
    });
  });
});
