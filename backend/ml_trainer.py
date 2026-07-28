"""
ml_trainer.py — Geosense Early Warning System
==============================================
Script untuk melatih model Machine Learning (Random Forest)
dari data simulasi dataset_longsor.csv.

Jalankan sekali untuk generate model:
    python ml_trainer.py

Output:
    model_geosense.pkl  → file model yang disimpan
    model_info.json     → info akurasi & feature importance
"""

import json
import math
import time

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix)
from sklearn.model_selection import train_test_split, cross_val_score

from localization import CENTER, to_polar

# ==========================================
# KONFIGURASI
# ==========================================
CSV_FILE   = "dataset_longsor.csv"
MODEL_FILE = "model_geosense.pkl"
INFO_FILE  = "model_info.json"

FEATURE_COLS = [
    "node1_mms", "node2_mms", "node3_mms",
    "node1_hum", "node2_hum", "node3_hum",
    "tdoa_12_ms", "tdoa_13_ms",
    "r_meter", "theta_deg",
    "max_mms", "avg_hum",
]

LABEL_COL    = "label"
LABEL_ORDER  = ["AMAN", "SIAGA", "BAHAYA"]   # urutan tingkat bahaya


# ==========================================
# EKSTRAKSI FITUR DARI CSV
# ==========================================

def extract_features(csv_file: str) -> pd.DataFrame:
    """
    Baca CSV dan ubah 3 baris per batch_id menjadi 1 baris fitur.

    Proses:
    1. Group by batch_id  (tiap batch = 1 event dari 3 geophone)
    2. Pivot node_id → kolom NODE_01 / NODE_02 / NODE_03
    3. Hitung TDOA dari arrival_timestamp
    4. Hitung r_meter & theta_deg dari posisi sumber simulasi
    5. Buat label dari status terparah di antara 3 node

    Returns:
        DataFrame dengan 1 baris per event + kolom fitur + label
    """
    print(f"[TRAINER] Membaca '{csv_file}'...")
    df = pd.read_csv(csv_file)
    print(f"[TRAINER] {len(df)} baris, {df['batch_id'].nunique()} event unik.")

    rows = []
    skipped = 0

    for batch_id, group in df.groupby("batch_id"):
        # Harus tepat 3 node
        if len(group) != 3:
            skipped += 1
            continue

        nodes = {row["node_id"]: row for _, row in group.iterrows()}
        if not all(n in nodes for n in ["NODE_01", "NODE_02", "NODE_03"]):
            skipped += 1
            continue

        n1, n2, n3 = nodes["NODE_01"], nodes["NODE_02"], nodes["NODE_03"]

        # --- TDOA (milidetik), relatif ke NODE_01 ---
        t1 = float(n1["arrival_timestamp"])
        t2 = float(n2["arrival_timestamp"])
        t3 = float(n3["arrival_timestamp"])
        tdoa_12 = (t2 - t1) * 1000.0   # bisa negatif jika NODE_02 lebih dulu
        tdoa_13 = (t3 - t1) * 1000.0

        # --- r_meter & theta_deg dari posisi sumber simulasi ---
        # (Ground truth dari CSV — saat produksi, nilai ini dari TDOA localization)
        src_x = float(n1["src_x_sim"])
        src_y = float(n1["src_y_sim"])
        r_meter, theta_deg = to_polar(src_x, src_y)

        # --- Nilai per node ---
        n1_mms = float(n1["nilai_mm_s"])
        n2_mms = float(n2["nilai_mm_s"])
        n3_mms = float(n3["nilai_mm_s"])
        n1_hum = float(n1["kelembapan_pct"])
        n2_hum = float(n2["kelembapan_pct"])
        n3_hum = float(n3["kelembapan_pct"])

        # --- Fitur turunan ---
        max_mms = max(n1_mms, n2_mms, n3_mms)
        avg_hum = (n1_hum + n2_hum + n3_hum) / 3.0

        # --- Label: status terparah dari 3 node ---
        statuses = [str(n1["status"]), str(n2["status"]), str(n3["status"])]
        if "BAHAYA" in statuses:
            label = "BAHAYA"
        elif "SIAGA" in statuses:
            label = "SIAGA"
        else:
            label = "AMAN"

        rows.append({
            "node1_mms" : round(n1_mms, 4),
            "node2_mms" : round(n2_mms, 4),
            "node3_mms" : round(n3_mms, 4),
            "node1_hum" : round(n1_hum, 2),
            "node2_hum" : round(n2_hum, 2),
            "node3_hum" : round(n3_hum, 2),
            "tdoa_12_ms": round(tdoa_12, 4),
            "tdoa_13_ms": round(tdoa_13, 4),
            "r_meter"   : round(r_meter, 4),
            "theta_deg" : round(theta_deg, 2),
            "max_mms"   : round(max_mms, 4),
            "avg_hum"   : round(avg_hum, 2),
            "label"     : label,
        })

    feature_df = pd.DataFrame(rows)
    print(f"[TRAINER] {len(feature_df)} event berhasil diekstrak. ({skipped} dilewati)")
    print(f"\n[TRAINER] Distribusi label:")
    print(feature_df["label"].value_counts().to_string())
    return feature_df


# ==========================================
# TRAINING
# ==========================================

def train_model(feature_df: pd.DataFrame) -> dict:
    """
    Latih Random Forest Classifier dan evaluasi akurasinya.

    Returns:
        dict berisi model, akurasi, dan feature importance
    """
    X = feature_df[FEATURE_COLS].values
    y = feature_df[LABEL_COL].values

    # Split data: 80% training, 20% testing
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n[TRAINER] Mulai training Random Forest...")
    print(f"  Data training : {len(X_train)} event")
    print(f"  Data testing  : {len(X_test)} event")

    t_start = time.time()

    # Model Random Forest
    model = RandomForestClassifier(
        n_estimators   = 200,      # Jumlah pohon keputusan
        max_depth      = 15,       # Kedalaman maksimum tiap pohon
        min_samples_split = 5,
        random_state   = 42,
        n_jobs         = -1,       # Pakai semua CPU core
        class_weight   = "balanced",  # Handle imbalance kelas
    )

    model.fit(X_train, y_train)
    t_elapsed = time.time() - t_start

    # --- Evaluasi ---
    y_pred     = model.predict(X_test)
    accuracy   = accuracy_score(y_test, y_pred)

    # Cross-validation (5-fold)
    cv_scores  = cross_val_score(model, X, y, cv=5, scoring="accuracy")

    print(f"\n[TRAINER] Training selesai dalam {t_elapsed:.2f} detik")
    print(f"\n{'='*50}")
    print(f"  HASIL EVALUASI MODEL")
    print(f"{'='*50}")
    print(f"  Akurasi Test Set    : {accuracy*100:.2f}%")
    print(f"  Akurasi CV (5-fold) : {cv_scores.mean()*100:.2f}% (+/- {cv_scores.std()*100:.2f}%)")
    print(f"\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=LABEL_ORDER))
    print(f"\n  Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred, labels=LABEL_ORDER)
    cm_df = pd.DataFrame(cm, index=LABEL_ORDER, columns=LABEL_ORDER)
    print(cm_df.to_string())

    # --- Feature Importance ---
    importances = model.feature_importances_
    feat_imp = sorted(
        zip(FEATURE_COLS, importances),
        key=lambda x: x[1], reverse=True
    )

    print(f"\n  Feature Importance (urutan terpenting):")
    for feat, imp in feat_imp:
        bar = "#" * int(imp * 40)
        print(f"    {feat:<15} {bar} {imp*100:.1f}%")

    return {
        "model"       : model,
        "accuracy"    : float(accuracy),
        "cv_mean"     : float(cv_scores.mean()),
        "cv_std"      : float(cv_scores.std()),
        "feat_imp"    : {f: float(i) for f, i in feat_imp},
        "elapsed_sec" : round(t_elapsed, 2),
    }


# ==========================================
# SIMPAN MODEL & INFO
# ==========================================

def save_model(result: dict):
    """Simpan model (.pkl) dan info akurasi (.json)."""
    joblib.dump(result["model"], MODEL_FILE)
    print(f"\n[TRAINER] Model disimpan ke '{MODEL_FILE}'")

    info = {
        "model_type"     : "RandomForestClassifier",
        "features"       : FEATURE_COLS,
        "labels"         : LABEL_ORDER,
        "accuracy_test"  : result["accuracy"],
        "cv_mean"        : result["cv_mean"],
        "cv_std"         : result["cv_std"],
        "feature_importance": result["feat_imp"],
        "training_time_sec" : result["elapsed_sec"],
    }

    with open(INFO_FILE, "w") as f:
        json.dump(info, f, indent=2)
    print(f"[TRAINER] Info model disimpan ke '{INFO_FILE}'")


# ==========================================
# MAIN
# ==========================================

if __name__ == "__main__":
    print("=" * 55)
    print("  Geosense EWS — ML Trainer")
    print("=" * 55)

    # 1. Ekstraksi fitur dari CSV
    feature_df = extract_features(CSV_FILE)

    # 2. Training
    result = train_model(feature_df)

    # 3. Simpan model
    save_model(result)

    print(f"\n[TRAINER] Selesai! Model siap digunakan oleh main.py.")
    print(f"  Akurasi: {result['accuracy']*100:.2f}%")
