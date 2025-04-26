/**
 * Background script for Bookmark Desktop extension
 */

// Listen for installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Bookmark Desktop extension installed or updated');
});

// Open Bookmark Desktop when the extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'bookmarkDesktop.html' });
});

// Keep the service worker alive (prevents it from being terminated when idle)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'keepAlive') {
    sendResponse({ status: 'alive' });
  }
  return true; // Required for async response
});