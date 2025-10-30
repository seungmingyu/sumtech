import io
import numpy as np
import torch
import soundfile as sf
import librosa
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor

MODEL_NAME = "mo-thecreator/Deepfake-audio-detection"

_device = "cuda" if torch.cuda.is_available() else "cpu"
_feature_extractor = None
_model = None

def _lazy_load():
    global _feature_extractor, _model
    if _feature_extractor is None or _model is None:
        _feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
        _model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME).to(_device)
        _model.eval()

def _to_mono(x: np.ndarray) -> np.ndarray:
    if x.ndim == 1:
        return x
    return np.mean(x, axis=1).astype(np.float32, copy=False)

def IsDeepfakeAudioFile(audio_bytes: bytes) -> int:
    try:
        if not isinstance(audio_bytes, (bytes, bytearray, memoryview)) or len(audio_bytes) == 0:
            return -1
        _lazy_load()

        with io.BytesIO(audio_bytes) as buffer:
            audio_data, sr = sf.read(buffer, dtype="float32", always_2d=False)

        audio_data = _to_mono(np.asarray(audio_data, dtype=np.float32))
        target_sr = getattr(_feature_extractor, "sampling_rate", 16000)
        if sr != target_sr:
            audio_data = librosa.resample(audio_data, orig_sr=sr, target_sr=target_sr)
            sr = target_sr

        max_len = target_sr * 10
        if len(audio_data) > max_len:
            audio_data = audio_data[:max_len]

        inputs = _feature_extractor(audio_data, sampling_rate=sr, return_tensors="pt")
        inputs = {k: v.to(_device) for k, v in inputs.items()}

        with torch.no_grad():
            logits = _model(**inputs).logits
            probs = torch.softmax(logits, dim=1)[0].detach().cpu().numpy()

        id2label = _model.config.id2label
        pred = int(np.argmax(probs))
        label = id2label.get(pred, "").lower()
        return 1 if "fake" in label else 0
    except Exception:
        return -1

def IsDeepfakeAudio(audio_path: str) -> int:
    try:
        with open(audio_path, "rb") as f:
            b = f.read()
        return IsDeepfakeAudioFile(b)
    except Exception:
        return -1
