"""
voice_service.py — ScamDefy AI Voice Detection
Complete rewrite to fix:
  1. Random jitter making results non-deterministic (removed)
  2. Untrained VoiceCNN polluting scores (replaced with pretrained HuggingFace model)
  3. Static magic-number heuristic thresholds (replaced with z-score approach)
  4. Asymmetric confidence reporting / silent UNCERTAIN verdicts (fixed)
  5. Gemini-UNKNOWN fallback hardcoding (replaced with dynamic weight redistribution)
"""

import os
import torch
import logging
import google.generativeai as genai
import librosa
import numpy as np
import json
import re
import threading
from typing import Dict, Any, Optional
from scipy.special import expit  # sigmoid function: 1 / (1 + exp(-x))
from utils.feature_extractor import extract_features

# ---------------------------------------------------------------------------
# Model checkpoint — swap this string to use a different wav2vec2-based
# deepfake classifier without touching any other logic in this file.
# MelodyMachine/Deepfake-audio-detection-V2 is used because it:
#   - Has a valid AutoFeatureExtractor config (unlike mo-thecreator which lacks one)
#   - Is publicly available without authentication
#   - Label mapping: {0: 'fake', 1: 'real'} — index 0 is the synthetic class
# ---------------------------------------------------------------------------
PRETRAINED_MODEL_ID = "MelodyMachine/Deepfake-audio-detection-V2"

# This model's feature extractor expects 16000 Hz — keep separate from the
# librosa heuristic pipeline which stays at 22050 Hz.
# Do not change this without also changing PRETRAINED_MODEL_ID.
WAV2VEC2_SAMPLE_RATE = 16000

# Label index for the SYNTHETIC/FAKE class in the chosen model.
# MelodyMachine model: 0 = fake, 1 = real  →  SYNTHETIC_LABEL_IDX = 0
# If you swap to a model where index 1 = synthetic, change this to 1.
SYNTHETIC_LABEL_IDX = 0

# ---------------------------------------------------------------------------
# Signal weights for the fusion score.
# Must sum to 1.0. get_effective_weights() normalises automatically, so
# you can change relative proportions here without updating any other code.
#   gemini:     strongest signal — semantic + acoustic LLM analysis
#   pretrained: wav2vec2 deepfake classifier trained on real vs synthetic
#   heuristic:  acoustic z-score anomaly detector, no external dependency
# ---------------------------------------------------------------------------
SIGNAL_WEIGHTS = {
    "gemini":     0.60,
    "pretrained": 0.30,
    "heuristic":  0.10,
}

# ---------------------------------------------------------------------------
# Reference distributions for human voice acoustic features.
# Derived from published acoustic phonetics research on read/spontaneous speech.
# Format: { feature_name: (mean, std) }
# A positive z-score means "more robotic than typical human speech".
# Update these if you collect real-world calibration data.
# ---------------------------------------------------------------------------
HUMAN_BASELINES = {
    "flatness_var": (0.0008, 0.0004),  # spectral flatness variance
    "zcr_var":      (0.0025, 0.0010),  # zero-crossing-rate variance
    "pitch_std":    (28.0,   12.0),    # pitch standard deviation in Hz
    "centroid_var": (0.015,  0.007),   # spectral centroid variance (normalised by Nyquist)
}

# Controls sigmoid steepness for the heuristic output score.
# Higher = sharper boundary; lower = more tolerant of variation.
HEURISTIC_SIGMOID_STEEPNESS = 2.0

# Minimum confidence to issue a REAL or SYNTHETIC verdict.
# Below this threshold return UNCERTAIN — an honest "don't know" is better
# than a wrong confident answer.
# Raise to reduce false positives; lower to reduce UNCERTAIN verdicts.
MINIMUM_CONFIDENCE = 0.58

# ---------------------------------------------------------------------------
# Pretrained model globals — lazy-loaded on first request
# ---------------------------------------------------------------------------
processor = None
pretrained_model = None
pretrained_available = False
_model_load_lock = threading.Lock()
_model_loading = False


def load_model():
    """
    Lazy-load the HuggingFace pretrained wav2vec2 deepfake detector.
    Thread-safe: only one thread will attempt the download at a time.
    If the download fails, pretrained_available is set to False and the
    system gracefully degrades to Gemini + heuristics only.
    NOTE: The old VoiceCNN (voice_cnn_model.py) is intentionally NOT used
    for inference — it has untrained/dummy weights. It is retained in the
    codebase so a future developer can train it on a real dataset.
    """
    global processor, pretrained_model, pretrained_available, _model_loading

    if pretrained_model is not None:
        return  # already loaded

    with _model_load_lock:
        if _model_loading:
            return  # another thread is already downloading
        _model_loading = True

    try:
        # Use AutoFeatureExtractor — works with any wav2vec2-based model regardless
        # of whether the repo has a tokenizer_config.json (Wav2Vec2Processor requires
        # that file; AutoFeatureExtractor does not).
        from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

        logging.info(
            f"[ScamDefy] Downloading pretrained model from HuggingFace "
            f"— this is a one-time download: {PRETRAINED_MODEL_ID}"
        )
        processor = AutoFeatureExtractor.from_pretrained(PRETRAINED_MODEL_ID)
        pretrained_model = AutoModelForAudioClassification.from_pretrained(PRETRAINED_MODEL_ID)
        pretrained_model.eval()
        pretrained_available = True
        logging.info(
            f"[ScamDefy] Pretrained model loaded. "
            f"Labels: {pretrained_model.config.id2label}"
        )
    except Exception as e:
        pretrained_available = False
        logging.warning(
            f"[ScamDefy] Pretrained model failed to load: {e}. "
            "Will rely on Gemini + heuristics only."
        )
    finally:
        _model_loading = False


# ---------------------------------------------------------------------------
# Weight redistribution
# ---------------------------------------------------------------------------

def get_effective_weights(gemini_available: bool, pretrained_available_flag: bool) -> dict:
    """
    Returns adjusted signal weights that always sum to 1.0.
    Redistributes weight from unavailable signals proportionally to available ones.
    Heuristic-only mode (both others unavailable) returns heuristic weight = 1.0.
    Never hardcodes special-case formulas — always derives from SIGNAL_WEIGHTS.
    """
    active = {}
    if gemini_available:
        active["gemini"] = SIGNAL_WEIGHTS["gemini"]
    if pretrained_available_flag:
        active["pretrained"] = SIGNAL_WEIGHTS["pretrained"]
    # heuristic is always available
    active["heuristic"] = SIGNAL_WEIGHTS["heuristic"]

    total = sum(active.values())
    # Normalise so weights sum to 1.0
    return {k: v / total for k, v in active.items()}


# ---------------------------------------------------------------------------
# Adaptive heuristics using z-scores
# ---------------------------------------------------------------------------

def run_heuristics(y: np.ndarray, sr: int) -> float:
    """
    Compute a synthetic-voice probability [0, 1] using z-score anomaly detection.

    Instead of comparing raw feature values to fixed magic-number thresholds
    (which break across microphones, codecs, and environments), each feature's
    deviation from a typical human baseline is expressed as a z-score.
    A positive z means "more robotic than human baseline".
    The aggregate z-score is squeezed through a sigmoid to produce [0, 1].

    If any individual feature extraction fails, that feature is skipped rather
    than crashing the whole heuristic pipeline.
    """
    z_scores = []

    # -- Feature 1: spectral flatness variance --
    try:
        flatness_var = float(np.var(librosa.feature.spectral_flatness(y=y)))
        mean, std = HUMAN_BASELINES["flatness_var"]
        # Synthetic voices have LOWER flatness variance — so we negate:
        # below-human baseline → positive z → higher synthetic probability
        z_scores.append(-(flatness_var - mean) / std)
    except Exception as e:
        logging.warning(f"[ScamDefy] flatness_var extraction failed: {e}")

    # -- Feature 2: zero-crossing rate variance --
    try:
        zcr_var = float(np.var(librosa.feature.zero_crossing_rate(y=y)))
        mean, std = HUMAN_BASELINES["zcr_var"]
        # Synthetic voices have LOWER zcr variance → negate
        z_scores.append(-(zcr_var - mean) / std)
    except Exception as e:
        logging.warning(f"[ScamDefy] zcr_var extraction failed: {e}")

    # -- Feature 3: pitch standard deviation --
    try:
        # librosa.yin returns 0 for unvoiced frames — exclude those
        f0 = librosa.yin(y, fmin=50, fmax=400)
        voiced_f0 = [p for p in f0 if p > 0]
        if len(voiced_f0) > 1:
            pitch_std = float(np.std(voiced_f0))
            mean, std = HUMAN_BASELINES["pitch_std"]
            # Synthetic voices have LOWER pitch variation → negate
            z_scores.append(-(pitch_std - mean) / std)
    except Exception as e:
        logging.warning(f"[ScamDefy] pitch_std extraction failed: {e}")

    # -- Feature 4: spectral centroid variance (normalised by Nyquist) --
    try:
        centroid_var = float(np.var(librosa.feature.spectral_centroid(y=y, sr=sr))) / (sr / 2)
        mean, std = HUMAN_BASELINES["centroid_var"]
        # Synthetic voices have LOWER centroid variance → negate
        z_scores.append(-(centroid_var - mean) / std)
    except Exception as e:
        logging.warning(f"[ScamDefy] centroid_var extraction failed: {e}")

    if not z_scores:
        logging.warning("[ScamDefy] All heuristic features failed — returning neutral 0.5")
        return 0.5

    # Aggregate z-scores → sigmoid → probability of being synthetic
    aggregate_z = float(np.mean(z_scores))
    score = float(expit(HEURISTIC_SIGMOID_STEEPNESS * aggregate_z))
    return score


# ---------------------------------------------------------------------------
# Gemini analysis
# ---------------------------------------------------------------------------

async def analyze_with_gemini(file_bytes: bytes, api_key: Optional[str] = None) -> Dict[str, Any]:
    """Use Gemini 1.5 Flash to detect acoustic/semantic artificiality in audio."""
    key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not key:
        return {"verdict": "UNKNOWN", "reason": "No API Key"}

    response = None
    try:
        genai.configure(api_key=key)
        model_gemini = genai.GenerativeModel('gemini-1.5-flash')

        audio_part = {"mime_type": "audio/wav", "data": file_bytes}

        prompt = (
            "Analyze this audio for signs of AI voice cloning or synthesis. "
            "Return JSON: { \"verdict\": \"REAL\" | \"SYNTHETIC\", "
            "\"confidence\": 0.0-1.0, \"reason\": \"string\" }"
        )

        response = await model_gemini.generate_content_async([prompt, audio_part])
        raw_text = response.text

        # Strip markdown code fences if Gemini wraps the JSON
        clean_json_str = raw_text
        json_match = re.search(r'```json\s*(.*?)\s*```', raw_text, re.DOTALL)
        if json_match:
            clean_json_str = json_match.group(1)
        else:
            json_match_alt = re.search(r'```\s*(.*?)\s*```', raw_text, re.DOTALL)
            if json_match_alt:
                clean_json_str = json_match_alt.group(1)

        clean_json_str = clean_json_str.strip()

        try:
            data = json.loads(clean_json_str)
            verdict = data.get("verdict", "UNKNOWN").upper()
            confidence = float(data.get("confidence", 0.5))
            return {
                "verdict": verdict,
                "confidence": confidence,
                "reason": data.get("reason", ""),
            }
        except Exception:
            # Fallback text scan if JSON parse fails
            if "SYNTHETIC" in raw_text.upper():
                return {"verdict": "SYNTHETIC", "confidence": 0.65, "reason": "Parsed from text (JSON failed)"}
            elif "REAL" in raw_text.upper():
                return {"verdict": "REAL", "confidence": 0.65, "reason": "Parsed from text (JSON failed)"}
            return {"verdict": "UNKNOWN", "reason": "JSON Parse Error"}

    except Exception as e:
        logging.warning(f"[ScamDefy] Gemini Voice Analysis failed: {e}")
        text = response.text.upper() if response and hasattr(response, 'text') and response.text else ""
        if "SYNTHETIC" in text:
            return {"verdict": "SYNTHETIC", "confidence": 0.55}
        return {"verdict": "UNKNOWN", "reason": str(e)}


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def analyze_audio(
    file_bytes: bytes, filename: str, api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Full voice analysis pipeline:
      1. Feature extraction (22050 Hz, for heuristics)
      2. Pretrained wav2vec2 inference (16000 Hz, separate resample)
      3. Adaptive heuristic z-score analysis
      4. Gemini LLM analysis
      5. Dynamic weight fusion with confidence floor
    """
    # Ensure the pretrained model is loaded (or attempted) before analysis.
    # load_model() is idempotent and thread-safe.
    load_model()

    try:
        # ---------------------------------------------------------------
        # Step A: Extract raw signal at 22050 Hz (heuristic pipeline)
        # ---------------------------------------------------------------
        data = extract_features(file_bytes)
        y = data["raw_signal"]    # np.ndarray at 22050 Hz
        sr = data["sample_rate"]  # 22050

        # ---------------------------------------------------------------
        # Step B: Pretrained model inference at 16000 Hz
        # Resample independently from the heuristic pipeline — the two
        # sample rates serve different purposes and must stay separate.
        # ---------------------------------------------------------------
        pretrained_prob = 0.5  # neutral fallback if model unavailable
        pretrained_warning = None

        if pretrained_available:
            y_16k = librosa.resample(y, orig_sr=sr, target_sr=WAV2VEC2_SAMPLE_RATE)
            inputs = processor(
                y_16k,
                sampling_rate=WAV2VEC2_SAMPLE_RATE,
                return_tensors="pt",
                padding=True,
            )
            with torch.no_grad():
                logits = pretrained_model(**inputs).logits
            # Model returns raw logits — softmax required to get probabilities.
            # SYNTHETIC_LABEL_IDX = 0 for MelodyMachine model (0=fake, 1=real).
            # Using the named constant avoids hardcoding the index here.
            probs = torch.softmax(logits, dim=-1)
            pretrained_prob = float(probs[0][SYNTHETIC_LABEL_IDX])
        else:
            pretrained_warning = "Pretrained model unavailable — using Gemini + heuristics"

        # ---------------------------------------------------------------
        # Step C: Adaptive heuristics (z-score based, 22050 Hz audio)
        # ---------------------------------------------------------------
        heuristic_score = run_heuristics(y, sr)

        # ---------------------------------------------------------------
        # Step D: Gemini analysis
        # ---------------------------------------------------------------
        gemini_result = await analyze_with_gemini(file_bytes, api_key)
        gemini_verdict = gemini_result.get("verdict", "UNKNOWN")

        # Convert Gemini verdict + confidence to a synthetic probability [0, 1]
        gemini_conf = gemini_result.get("confidence", 0.5)
        if gemini_verdict == "SYNTHETIC":
            gemini_score = gemini_conf
            gemini_available = True
        elif gemini_verdict == "REAL":
            gemini_score = 1.0 - gemini_conf
            gemini_available = True
        else:
            # UNKNOWN — treat Gemini as unavailable so its weight is redistributed.
            # Do NOT use a hardcoded fallback value here.
            gemini_score = 0.0  # unused; gemini_available=False prevents its use
            gemini_available = False

        # ---------------------------------------------------------------
        # Step E: Dynamic weight fusion
        # ---------------------------------------------------------------
        low_confidence = False
        weights = get_effective_weights(
            gemini_available=gemini_available,
            pretrained_available_flag=pretrained_available,
        )

        # If only heuristic is available, flag low confidence
        if not gemini_available and not pretrained_available:
            low_confidence = True

        final_score = 0.0
        if "gemini" in weights:
            final_score += weights["gemini"] * gemini_score
        if "pretrained" in weights:
            final_score += weights["pretrained"] * pretrained_prob
        if "heuristic" in weights:
            final_score += weights["heuristic"] * heuristic_score

        # ---------------------------------------------------------------
        # Step F: Confidence floor — UNCERTAIN is an honest answer
        # ---------------------------------------------------------------
        if final_score > 0.5:
            verdict = "SYNTHETIC"
            confidence = final_score
        else:
            verdict = "REAL"
            confidence = 1.0 - final_score

        if confidence < MINIMUM_CONFIDENCE:
            # Signals are too ambiguous — don't issue a wrong confident verdict
            verdict = "UNCERTAIN"
            low_confidence = True

        # ---------------------------------------------------------------
        # Build response — additive new fields only, existing schema unchanged
        # ---------------------------------------------------------------
        response: Dict[str, Any] = {
            "verdict": verdict,
            "confidence": float(confidence),
            "low_confidence": low_confidence,
            "model_results": {
                "pretrained_prob": pretrained_prob,
                "heuristic_score": heuristic_score,
                "gemini_verdict": gemini_verdict,
                "gemini_confidence": gemini_conf,
                "effective_weights": weights,
            },
            "pretrained_model": PRETRAINED_MODEL_ID if pretrained_available else None,
        }

        if pretrained_warning:
            response["warning"] = pretrained_warning
        if not gemini_available and gemini_verdict == "UNKNOWN":
            response.setdefault("low_confidence", True)

        return response

    except Exception as exc:
        logging.error(f"[ScamDefy] Voice analysis error for {filename}: {exc}")
        return {
            "verdict": "ERROR",
            "confidence": 0.0,
            "warning": str(exc),
        }
