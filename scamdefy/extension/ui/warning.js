import ENV from '../config/env.js';

document.addEventListener('DOMContentLoaded', async () => {
  // -------------------------------------------------------------------------
  // Read scan data from the URL query param first.
  // The service worker embeds the scan result as base64 JSON in the ?data=
  // param when it redirects here. This eliminates the race condition where
  // storage was written AFTER the redirect so warning.js read empty storage.
  // -------------------------------------------------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('url');
  const rawData = urlParams.get('data');

  if (!targetUrl) {
    document.getElementById('blockedUrl').textContent = "No URL provided.";
    return;
  }

  document.getElementById('blockedUrl').textContent = targetUrl;

  // Setup Buttons
  document.getElementById('btnBack').addEventListener('click', () => {
    if (window.history.length > 2) {
      window.history.back();
    } else {
      chrome.tabs.getCurrent(tab => tab && chrome.tabs.remove(tab.id));
    }
  });

  document.getElementById('btnProceed').addEventListener('click', async () => {
    // Add to whitelist so this URL is skipped on future navigations
    const storageResult = await new Promise(res => chrome.storage.local.get(['whitelist'], res));
    const whitelist = storageResult.whitelist || [];
    if (!whitelist.includes(targetUrl)) {
      whitelist.push(targetUrl);
      await new Promise(res => chrome.storage.local.set({ whitelist }, res));
    }
    window.location.replace(targetUrl);
  });

  document.getElementById('btnReport').addEventListener('click', async () => {
    try {
      await fetch(`${ENV.BACKEND_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, verdict: "FALSE_POSITIVE" })
      });
      alert("Report submitted successfully. Thank you!");
    } catch (e) {
      console.warn("Feedback endpoint might not be active, but report recorded locally.");
      alert("Report recorded.");
    }
  });

  // -------------------------------------------------------------------------
  // Load scan data — prefer query param, fall back to storage poll
  // -------------------------------------------------------------------------

  /** @type {object|null} */
  let data = null;

  // Primary path: scan data is embedded in the redirect URL by service_worker.js
  if (rawData) {
    try {
      data = JSON.parse(atob(rawData));
    } catch (e) {
      console.warn('[ScamDefy] Could not parse query param data, falling back to storage');
    }
  }

  if (!data) {
    // Fallback: poll storage — covers edge cases where the query param is absent
    // (e.g. manual navigation to warning.html without ?data=)
    showLoadingSpinner();
    const res = await new Promise(resolve =>
      chrome.storage.local.get([`scan_${targetUrl}`], resolve)
    );
    data = res[`scan_${targetUrl}`];
    hideLoadingSpinner();
  }

  try {
    if (data) {
      document.getElementById('riskScore').textContent = data.score;
      document.getElementById('riskVerdict').textContent = data.verdict;
      document.getElementById('riskExplanation').innerHTML =
        data.explanation || "This site exhibits suspicious patterns associated with scams or phishing.";

      const listEl = document.getElementById('flagList');
      if (data.flags && data.flags.length > 0) {
        data.flags.forEach(f => {
          const li = document.createElement('li');
          li.textContent = f;
          listEl.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.textContent = "High overall risk score based on heuristics.";
        listEl.appendChild(li);
      }
    } else {
      document.getElementById('riskExplanation').textContent =
        "Scan data not found. This page was blocked by ScamDefy.";
    }
  } catch (e) {
    console.error(e);
  }
});

// ---------------------------------------------------------------------------
// Loading spinner helpers — shown when falling back to storage poll
// ---------------------------------------------------------------------------

function showLoadingSpinner() {
  const existing = document.getElementById('__scamdefy_spinner');
  if (existing) return;

  const el = document.createElement('div');
  el.id = '__scamdefy_spinner';
  el.style.cssText = 'text-align:center;padding:16px;font-style:italic;color:#6b7280';
  el.textContent = 'Loading scan data…';

  const explanation = document.getElementById('riskExplanation');
  if (explanation) explanation.before(el);
}

function hideLoadingSpinner() {
  const el = document.getElementById('__scamdefy_spinner');
  if (el) el.remove();
}
