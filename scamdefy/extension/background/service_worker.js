import ENV from '../config/env.js';
import { handleMessage } from './messageRouter.js';
import { runAllHealthChecks } from './healthCheck.js';
import { validateConfig } from '../config/env.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCAN_TIMEOUT_MS = 4000;

const pendingScans = new Map();

// ---------------------------------------------------------------------------
// Extension lifecycle
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[ScamDefy] Extension Installed. Running setup...");

  const configStatus = validateConfig();
  console.log("[ScamDefy] Config Valid:", configStatus.valid, configStatus.missing);

  await runAllHealthChecks();

  chrome.alarms.create("healthCheckAlarm", { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "healthCheckAlarm") {
    await runAllHealthChecks();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(err => sendResponse({ success: false, error: err.toString() }));
  return true;
});

// ---------------------------------------------------------------------------
// URL skip helper
// ---------------------------------------------------------------------------

function shouldSkipUrl(url) {
  if (!url) return true;
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:') ||
    url.includes('localhost') ||
    url.includes('127.0.0.1')
  );
}

// ---------------------------------------------------------------------------
// Primary listener: onBeforeNavigate
// ---------------------------------------------------------------------------

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const url = details.url;
  if (shouldSkipUrl(url)) return;

  const { whitelist = [] } = await chrome.storage.local.get(['whitelist']);
  if (whitelist.includes(url)) return;

  const scanPromise = handleMessage({ type: 'SCAN_URL', payload: { url } }, null);
  pendingScans.set(details.tabId, { promise: scanPromise, url });
});

// ---------------------------------------------------------------------------
// Fallback listener: onCommitted
// ---------------------------------------------------------------------------

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const url = details.url;
  if (shouldSkipUrl(url)) return;

  const pending = pendingScans.get(details.tabId);
  pendingScans.delete(details.tabId);

  let scanPromise;
  if (pending && pending.url === url) {
    scanPromise = pending.promise;
  } else {
    const { whitelist = [] } = await chrome.storage.local.get(['whitelist']);
    if (whitelist.includes(url)) return;
    scanPromise = handleMessage({ type: 'SCAN_URL', payload: { url } }, null);
  }

  const timeoutPromise = new Promise(resolve =>
    setTimeout(() => resolve({ timedOut: true }), SCAN_TIMEOUT_MS)
  );

  const outcome = await Promise.race([scanPromise, timeoutPromise]);

  if (outcome.timedOut) {
    injectBanner(details.tabId, {
      verdict: 'SCANNING',
      score: null,
      url,
      color: '#6b7280',
    });
    const result = await scanPromise;
    handleScanResult(details.tabId, url, result);
    return;
  }

  handleScanResult(details.tabId, url, outcome);
});

// ---------------------------------------------------------------------------
// handleScanResult
// Score bands:
//   >= 60  → BLOCKED: hard redirect to warning page
//   30–59  → CAUTION: yellow inline banner
//    < 30  → SAFE: do nothing
// ---------------------------------------------------------------------------

async function handleScanResult(tabId, url, scanResponse) {
  if (!scanResponse?.success || !scanResponse?.data) {
    injectBanner(tabId, {
      verdict: 'ERROR',
      score: null,
      url,
      color: '#94a3b8',
    });
    return;
  }

  const result = scanResponse.data;

  chrome.storage.local.set({ [`scan_${url}`]: result });

  if (result.score >= 60) {
    // Block: hard redirect to warning page for any score >= 60
    const encoded = btoa(JSON.stringify(result));
    const warningUrl = chrome.runtime.getURL(
      `ui/warning.html?url=${encodeURIComponent(url)}&data=${encoded}`
    );
    chrome.tabs.update(tabId, { url: warningUrl });

  } else if (result.score >= 30) {
    // CAUTION: yellow informational banner, no redirect
    injectBanner(tabId, {
      verdict: result.verdict,
      score: result.score,
      url,
      color: '#f59e0b',
    });
  }
  // score < 30 = SAFE — do nothing
}

// ---------------------------------------------------------------------------
// injectBanner
// ---------------------------------------------------------------------------

async function injectBanner(tabId, args) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/warningBanner.js'],
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (bannerArgs) => window.__scamdefyShowBanner(bannerArgs),
      args: [args],
    });
  } catch (e) {
    console.warn('[ScamDefy] Banner injection failed:', e);
  }
}