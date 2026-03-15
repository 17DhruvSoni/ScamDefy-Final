# CHANGES.md — ScamDefy v1.0.0 → v1.1.0

## Bug 1 Fix — AI Voice Detection Overhaul

### `backend/services/voice_service.py` — **Full Rewrite**

| What changed | Why |
|---|---|
| Removed `final_score += (np.random.rand() * 0.01)` | Made the system non-deterministic — same audio produced different verdicts on every call |
| Replaced `VoiceCNN` inference with `Wav2Vec2ForSequenceClassification` (`mo-thecreator/Deepfake-audio-detection`) | VoiceCNN had untrained/dummy weights producing essentially random ~0.5 outputs |
| Applied `torch.softmax(logits, dim=-1)` explicitly | Wav2Vec2 returns raw logits, not probabilities. Unlike VoiceCNN which applied softmax in `forward()`, this model requires explicit softmax |
| Resampled to 16000 Hz separately for wav2vec2 | Wav2Vec2 requires exactly 16 kHz; heuristics still use 22050 Hz (librosa default). Two independent pipelines |
| Rewrote `run_heuristics()` with z-score approach against `HUMAN_BASELINES` | Static magic-number thresholds broke for different microphones, environments, and codecs. Z-scores are statistically principled |
| Added 4 acoustic features: `flatness_var`, `zcr_var`, `pitch_std`, `centroid_var` | Covers more acoustic dimensions than the two features in the original; pitch is especially discriminating for AI voices |
| Added `SIGNAL_WEIGHTS` dict + `get_effective_weights()` pure function | Replaced three separate hardcoded weight formulas. Weights now redistribute proportionally when any signal is unavailable |
| Added `MINIMUM_CONFIDENCE = 0.58` floor + `UNCERTAIN` verdict | A score of 0.45 previously reported "REAL at 55%", which is noise. UNCERTAIN is an honest answer |
| Gemini `UNKNOWN` triggers `gemini_available = False` → weight redistribution | Previously fell back to `(heuristic * 0.65) + (cnn * 0.35)` which heavily weighted the untrained CNN |
| Added `_model_load_lock` thread safety | Prevents multiple threads from downloading the ~360 MB model simultaneously |
| All tunable values are named constants at file top | Complies with "no hardcoded magic numbers" constraint |

---

### `backend/routes/voice.py` — **Modified**

| What changed | Why |
|---|---|
| Added 503 response when `_model_loading and not pretrained_available` | Clients should retry gracefully instead of receiving corrupt results during model download |
| Updated imports to new `voice_service` globals | Old `model_loaded` / `weights_warning` replaced with `pretrained_available`, `_model_loading` |
| Updated `/voice/health` to report pretrained model status | Old health check exposed VoiceCNN fields that no longer exist |

---

### `backend/requirements.txt` — **Modified**

Added:
- `transformers>=4.30.0` — HuggingFace library for Wav2Vec2 pretrained model
- `torchaudio>=2.0.0` — required by transformers audio processing
- `soundfile>=0.12.1` — was an implicit dependency, now explicit

---

## Bug 2 Fix — Scam/Risky Website Auto-Blocking

### `extension/background/service_worker.js` — **Full Rewrite**

| What changed | Why |
|---|---|
| Added `chrome.webNavigation.onBeforeNavigate` as primary listener | `onCommitted` fires after the page starts loading — too late to intercept. `onBeforeNavigate` fires before any network request |
| `onBeforeNavigate` stores scan promise in `pendingScans` Map | Allows `onCommitted` to reuse the already-started scan instead of firing a duplicate request |
| `onCommitted` kept as fallback with `pendingScans` reuse | Handles JS navigations, pushState, form submissions where `onBeforeNavigate` may not fire |
| `Promise.race([scanPromise, timeoutPromise])` with `SCAN_TIMEOUT_MS = 4000` | Slow backends no longer block the UX — a neutral "SCANNING" banner shows immediately |
| `handleScanResult()` routes by score band: 80+ redirect, 60–79 orange banner, 30–59 yellow banner | DANGER and CAUTION sites were previously silently ignored |
| Scan data embedded as `btoa(JSON.stringify(result))` in redirect URL `?data=` | Storage was written AFTER redirect, so `warning.js` read empty storage. Query param is available instantly |
| `injectBanner()` two-step executeScript: file then func | Required because `files[]` and `func` execute as separate script tasks; must inject file first, then call registered function |
| `shouldSkipUrl()` extracted as named helper | Eliminates duplication between the two navigation listeners and makes the skip logic testable |
| `SCAN_TIMEOUT_MS` and `pendingScans` defined as named constants/declarations at top | Complies with "no magic numbers" constraint |

---

### `extension/ui/warning.js` — **Modified**

| What changed | Why |
|---|---|
| Added `rawData = urlParams.get('data')` → `JSON.parse(atob(rawData))` as primary data source | Eliminates storage race condition. Data is embedded in the URL by service_worker.js on redirect |
| Added `showLoadingSpinner()` / `hideLoadingSpinner()` around storage fallback | UX improvement for the edge case where query param is absent |
| Storage poll preserved as fallback | Covers manual navigation to warning.html or other edge cases |

---

### `extension/content/warningBanner.js` — **New File**

Self-contained injectable content script. Registers `window.__scamdefyShowBanner(args)`.
Called by `service_worker.js` via `chrome.scripting.executeScript` for DANGER (orange) and CAUTION (yellow) verdicts.
Shows a fixed banner at the top of any page without redirecting the user.

---

### `extension/manifest.json` — **Modified**

| What changed | Why |
|---|---|
| `web_accessible_resources` expanded to include `ui/warning.js`, `content/warningBanner.js`, `icons/*` | `chrome.scripting.executeScript` with `files[]` requires the script to be listed here; missing entry silently fails injection |

---

## Constraints Verified

- ✅ `voice_cnn_model.py` — not modified (architecture preserved for future training)
- ✅ `feature_extractor.py` — not modified (stays at 22050 Hz for heuristics)
- ✅ `chrome.webNavigation.onCompleted` — not used anywhere
- ✅ `/voice` and `/scan` API schemas — new fields are additive only (`low_confidence`, `warning`, `pretrained_model`)
- ✅ Gemini integration — retained as 60% signal (highest weight)
- ✅ No hardcoded thresholds, scores, or weights in business logic
