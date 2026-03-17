
/**
 * Content script to sync dashboard settings with the extension storage.
 * Listens for the 'scamdefy-settings-updated' custom event dispatched by Settings.tsx
 */

(function() {
  console.log('[ScamDefy] SyncSettings content script loaded.');

  window.addEventListener('scamdefy-settings-updated', (event) => {
    const { protectionLevel } = event.detail;
    console.log('[ScamDefy] Settings update detected:', protectionLevel);
    
    // Read the full settings from localStorage (which was just updated by useSettings.ts)
    const settingsRaw = localStorage.getItem('scamdefy_settings');
    if (settingsRaw) {
      const settings = JSON.parse(settingsRaw);
      chrome.runtime.sendMessage({
        type: 'SYNC_SETTINGS',
        payload: settings
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[ScamDefy] Failed to sync settings:', chrome.runtime.lastError);
        } else {
          console.log('[ScamDefy] Settings synced successfully:', response);
        }
      });
    }
  });

  // Initial sync on load
  const initialSettings = localStorage.getItem('scamdefy_settings');
  if (initialSettings) {
    chrome.runtime.sendMessage({
      type: 'SYNC_SETTINGS',
      payload: JSON.parse(initialSettings)
    });
  }
})();
