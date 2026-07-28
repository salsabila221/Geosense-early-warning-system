"""
ml_predictor.py — Geosense Early Warning System
================================================
Modul yang memuat model ML yang sudah dilatih
dan menyediakan fungsi prediksi status untuk main.py.

Dipakai oleh main.py setelah hasil lokalisasi TDOA tersedia.
"""

import json
import os
from typing import Optional

import joblib
import numpy as np

MODEL_FILE = "model_geosense.pkl"
INFO_FILE  = "model_info.json"

FEATURE_COLS = [
    "node1_mms", "node2_mms", "node3_mms",
    "node1_hum", "node2_hum", "node3_hum",
    "tdoa_12_ms", "tdoa_13_ms",
    "r_meter", "theta_deg",
    "max_mms", "avg_hum",
]

# ==========================================
# LOAD MODEL (saat modul diimport)
# ==========================================
_model      = None
_model_info = {}

def _load_model():
    """Muat model dari file .pkl. Dipanggil sekali saat startup."""
    global _model, _model_info

    if not os.path.exists(MODEL_FILE):
        print(f"[ML] Model '{MODEL_FILE}' belum ada.")
        print("[ML] Jalankan 'python ml_trainer.py' terlebih dahulu.")
        return False

    try:
        _model = joblib.load(MODEL_FILE)
        print(f"[ML] Model berhasil dimuat dari '{MODEL_FILE}'")

        if os.path.exists(INFO_FILE):
            with open(INFO_FILE) as f:
                _model_info = json.load(f)
            acc = _model_info.get("accuracy_test", 0)
            print(f"[ML] Akurasi model: {acc*100:.2f}%")

        return True
    except Exception as e:
        print(f"[ML ERROR] Gagal load model: {e}")
        return False

# Load otomatis saat diimport
MODEL_LOADED = _load_model()


# ==========================================
# FUNGSI PREDIKSI UTAMA
# ==========================================

def predict_status(sensor_event: dict) -> dict:
    """
    Prediksi status bahaya longsor dari data 1 event seismik.

    Args:
        sensor_event: dict dengan key berikut (dari hasil buffer 3 node + lokalisasi):
        {
            "node1_mms"  : float,   # getaran NODE_01 (mm/s)
            "node2_mms"  : float,   # getaran NODE_02 (mm/s)
            "node3_mms"  : float,   # getaran NODE_03 (mm/s)
            "node1_hum"  : float,   # kelembapan NODE_01 (%)
            "node2_hum"  : float,   # kelembapan NODE_02 (%)
            "node3_hum"  : float,   # kelembapan NODE_03 (%)
            "tdoa_12_ms" : float,   # selisih waktu tiba NODE_01 vs NODE_02 (ms)
            "tdoa_13_ms" : float,   # selisih waktu tiba NODE_01 vs NODE_03 (ms)
            "r_meter"    : float,   # jarak sumber dari pusat sensor (m)
            "theta_deg"  : float,   # arah sumber 0-360° (bearing)
        }

    Returns:
        {
            "success"      : True,
            "status"       : "AMAN" / "SIAGA" / "BAHAYA",
            "probabilities": {"AMAN": 0.05, "SIAGA": 0.15, "BAHAYA": 0.80},
            "confidence"   : 0.80,
            "method"       : "ML"
        }
        atau jika model tidak tersedia, pakai fallback rule-based:
        {
            "success"  : True,
            "status"   : "...",
            "method"   : "rule-based"
        }
    """
    if not MODEL_LOADED or _model is None:
        # Fallback ke rule-based jika model belum ada
        return _rule_based_fallback(sensor_event)

    try:
        # Hitung fitur turunan
        n1 = float(sensor_event.get("node1_mms", 0))
        n2 = float(sensor_event.get("node2_mms", 0))
        n3 = float(sensor_event.get("node3_mms", 0))
        h1 = float(sensor_event.get("node1_hum", 0))
        h2 = float(sensor_event.get("node2_hum", 0))
        h3 = float(sensor_event.get("node3_hum", 0))

        max_mms = max(n1, n2, n3)
        avg_hum = (h1 + h2 + h3) / 3.0

        # Susun feature vector sesuai urutan FEATURE_COLS
        feature_vector = np.array([[
            n1,
            n2,
            n3,
            h1,
            h2,
            h3,
            float(sensor_event.get("tdoa_12_ms", 0)),
            float(sensor_event.get("tdoa_13_ms", 0)),
            float(sensor_event.get("r_meter", 0)),
            float(sensor_event.get("theta_deg", 0)),
            max_mms,
            avg_hum,
        ]])

        # Prediksi
        prediction    = _model.predict(feature_vector)[0]
        probabilities = _model.predict_proba(feature_vector)[0]
        classes       = _model.classes_

        prob_dict = {cls: round(float(prob), 4)
                     for cls, prob in zip(classes, probabilities)}

        # Confidence = probabilitas kelas yang diprediksi
        confidence = prob_dict.get(prediction, 0.0)

        return {
            "success"      : True,
            "status"       : str(prediction),
            "probabilities": prob_dict,
            "confidence"   : confidence,
            "method"       : "ML",
        }

    except Exception as e:
        print(f"[ML ERROR] Gagal prediksi: {e}. Pakai rule-based fallback.")
        return _rule_based_fallback(sensor_event)


def _rule_based_fallback(sensor_event: dict) -> dict:
    """
    Fallback klasifikasi manual jika model ML tidak tersedia.
    Konsisten dengan logika di dataset_longsor.py dan prosesing.py.
    """
    max_mms = max(
        float(sensor_event.get("node1_mms", 0)),
        float(sensor_event.get("node2_mms", 0)),
        float(sensor_event.get("node3_mms", 0)),
    )
    avg_hum = (
        float(sensor_event.get("node1_hum", 0)) +
        float(sensor_event.get("node2_hum", 0)) +
        float(sensor_event.get("node3_hum", 0))
    ) / 3.0

    if max_mms >= 5.0 and avg_hum > 80.0:
        status = "BAHAYA"
    elif max_mms >= 2.0 or avg_hum > 70.0:
        status = "SIAGA"
    else:
        status = "AMAN"

    return {
        "success"      : True,
        "status"       : status,
        "probabilities": {},
        "confidence"   : 1.0,
        "method"       : "rule-based",
    }


# ==========================================
# INFO MODEL
# ==========================================

def get_model_info() -> dict:
    """Kembalikan info model untuk endpoint /api/ml/model-info."""
    if not MODEL_LOADED:
        return {"loaded": False, "message": "Model belum ditraining. Jalankan ml_trainer.py"}

    return {
        "loaded"             : True,
        "model_type"         : _model_info.get("model_type", "RandomForestClassifier"),
        "accuracy_test"      : _model_info.get("accuracy_test", 0),
        "cv_mean"            : _model_info.get("cv_mean", 0),
        "features"           : FEATURE_COLS,
        "labels"             : _model_info.get("labels", []),
        "feature_importance" : _model_info.get("feature_importance", {}),
    }
