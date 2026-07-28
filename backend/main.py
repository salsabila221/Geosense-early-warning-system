"""
main.py — Geosense Early Warning System
========================================
FastAPI backend server dengan fitur:
  1. MQTT Subscriber → menerima data sensor dari HiveMQ Cloud
  2. Buffer 3-Node   → mengumpulkan data dari NODE_01/02/03 per event
  3. Lokalisasi TDOA → menghitung posisi & arah sumber getaran (koordinat polar)
  4. Machine Learning → prediksi status AMAN/SIAGA/BAHAYA dengan Random Forest
  5. REST API        → endpoint untuk frontend dashboard
  6. Admin Override  → admin bisa paksa ubah status EWS
"""

import ssl
import json
import time
import threading
import uuid
from collections import defaultdict
from typing import Dict

import paho.mqtt.client as mqtt
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from ml_predictor import predict_status, get_model_info
from database import engine, get_db, SessionLocal
from localization import localize_source, get_geophone_info, REQUIRED_NODES

# ==========================================
# SETUP DATABASE
# ==========================================
models.Base.metadata.create_all(bind=engine)

# ==========================================
# FLAG KONTROL
# ==========================================
IS_OVERRIDDEN = False   # False = Otomatis dari MQTT | True = Dikunci Admin

# ==========================================
# BUFFER LOKALISASI 3-NODE
# ==========================================
# Struktur: { window_key: { node_id: payload_dict } }
_node_buffer: Dict[str, Dict[str, dict]] = defaultdict(dict)
_buffer_lock    = threading.Lock()
_buffer_timers: Dict[str, threading.Timer] = {}

# Toleransi waktu untuk mengelompokkan data dari 3 node (detik)
LOCALIZATION_WINDOW_SEC = 2.0


# ==========================================
# FUNGSI DATABASE
# ==========================================

def update_status_in_db(new_status: str):
    """Update satu baris SystemStatus (id=1)."""
    db = SessionLocal()
    try:
        entry = db.query(models.SystemStatus).filter(models.SystemStatus.id == 1).first()
        if not entry:
            entry = models.SystemStatus(id=1, status=new_status)
            db.add(entry)
        else:
            entry.status = new_status
        db.commit()
    finally:
        db.close()


def save_sensor_reading(payload: dict):
    """Simpan 1 pembacaan sensor (1 node) ke tabel sensor_readings."""
    db = SessionLocal()
    try:
        reading = models.SensorReading(
            batch_id          = payload.get("batch_id", ""),
            node_id           = payload.get("node_id", "UNKNOWN"),
            arrival_timestamp = float(payload.get("arrival_timestamp", time.time())),
            nilai_mm_s        = float(payload.get("nilai_mm_s", 0.0)),
            kelembapan_pct    = float(payload.get("kelembapan_pct", 0.0)),
            rssi              = payload.get("rssi"),
            status            = payload.get("status", "Aman"),
        )
        db.add(reading)
        db.commit()
    finally:
        db.close()


def save_seismic_event(batch_id: str, loc_result: dict, overall_status: str):
    """Simpan hasil lokalisasi TDOA ke tabel seismic_events."""
    db = SessionLocal()
    try:
        event = models.SeismicEvent(
            batch_id       = batch_id,
            source_x       = loc_result["cartesian"]["x"],
            source_y       = loc_result["cartesian"]["y"],
            r_meter        = loc_result["polar"]["r_meter"],
            theta_deg      = loc_result["polar"]["theta_deg"],
            confidence     = loc_result["confidence"],
            reference_node = loc_result["reference_node"],
            wave_velocity  = loc_result["wave_velocity"],
            tdoa_ms        = json.dumps(loc_result["tdoa_ms"]),
            overall_status = overall_status,
        )
        # Gunakan merge agar tidak duplikat jika batch_id sama
        db.merge(event)
        db.commit()
    finally:
        db.close()


# ==========================================
# LOGIKA BUFFER & LOKALISASI
# ==========================================

def _get_window_key(payload: dict) -> str:
    """
    Buat kunci grup dari batch_id (jika ada) atau time-window.
    batch_id dihasilkan oleh dataset generator atau firmware ESP32.
    Fallback: timestamp dibulatkan per LOCALIZATION_WINDOW_SEC.
    """
    batch_id = payload.get("batch_id", "")
    if batch_id:
        return f"batch::{batch_id}"
    ts     = float(payload.get("arrival_timestamp", time.time()))
    window = int(ts / LOCALIZATION_WINDOW_SEC)
    return f"window::{window}"


def _extract_batch_id(window_key: str) -> str:
    """Ambil batch_id dari window_key (atau buat random jika time-window)."""
    if window_key.startswith("batch::"):
        return window_key[len("batch::"):]
    return uuid.uuid4().hex[:10]


def _try_localize(window_key: str):
    """
    Coba jalankan lokalisasi jika data dari ketiga node sudah terkumpul.
    Dipanggil setiap kali node baru masuk ke buffer,
    atau oleh timer (cleanup jika data tidak lengkap).
    """
    with _buffer_lock:
        group = dict(_node_buffer.get(window_key, {}))

        # Batalkan timer jika ada
        timer = _buffer_timers.pop(window_key, None)
        if timer:
            timer.cancel()

        if set(group.keys()) < REQUIRED_NODES:
            # Belum lengkap — tidak proses, biarkan timer handle cleanup
            return

        # Lengkap → hapus dari buffer, lanjut proses
        _node_buffer.pop(window_key, None)

    # Kumpulkan arrival_timestamp dari masing-masing node
    arrival_times = {
        node_id: data["arrival_timestamp"]
        for node_id, data in group.items()
    }

    # Status terparah dari ketiga node (rule-based fallback)
    statuses       = [d["status"] for d in group.values()]
    overall_status = _map_worst_status(statuses)

    # Jalankan lokalisasi TDOA
    loc_result = localize_source(arrival_times)
    batch_id   = _extract_batch_id(window_key)

    if loc_result["success"]:
        # --- PREDIKSI MACHINE LEARNING ---
        n_data = {nid: group[nid] for nid in group}

        # Susun sensor_event untuk ML predictor
        t1 = float(group.get("NODE_01", {}).get("arrival_timestamp", 0))
        t2 = float(group.get("NODE_02", {}).get("arrival_timestamp", 0))
        t3 = float(group.get("NODE_03", {}).get("arrival_timestamp", 0))

        sensor_event = {
            "node1_mms" : float(group.get("NODE_01", {}).get("nilai_mm_s", 0)),
            "node2_mms" : float(group.get("NODE_02", {}).get("nilai_mm_s", 0)),
            "node3_mms" : float(group.get("NODE_03", {}).get("nilai_mm_s", 0)),
            "node1_hum" : float(group.get("NODE_01", {}).get("kelembapan_pct", 0)),
            "node2_hum" : float(group.get("NODE_02", {}).get("kelembapan_pct", 0)),
            "node3_hum" : float(group.get("NODE_03", {}).get("kelembapan_pct", 0)),
            "tdoa_12_ms": (t2 - t1) * 1000.0,
            "tdoa_13_ms": (t3 - t1) * 1000.0,
            "r_meter"   : loc_result["polar"]["r_meter"],
            "theta_deg" : loc_result["polar"]["theta_deg"],
        }

        ml_result      = predict_status(sensor_event)
        ml_status      = ml_result["status"]
        ml_confidence  = ml_result["confidence"]
        ml_method      = ml_result["method"]
        ml_proba       = ml_result.get("probabilities", {})

        # Mapping status ML ke format tampilan
        status_map     = {"BAHAYA": "Warning", "SIAGA": "Siaga", "AMAN": "Aman"}
        overall_status = status_map.get(ml_status, overall_status)

        # Simpan ke DB (dengan info ML)
        save_seismic_event(batch_id, loc_result, overall_status)

        if not IS_OVERRIDDEN:
            update_status_in_db(overall_status)

        print(
            f"[LOKALISASI+ML] "
            f"r={loc_result['polar']['r_meter']:.2f} m | "
            f"theta={loc_result['polar']['theta_deg']:.1f} deg | "
            f"ML={ml_status} ({ml_confidence:.0%}) via {ml_method} | "
            f"Status={overall_status}"
        )
    else:
        print(f"[LOKALISASI ERROR] {loc_result.get('error', 'Unknown error')}")


def _cleanup_buffer(window_key: str):
    """Bersihkan buffer yang tidak pernah lengkap setelah timeout."""
    with _buffer_lock:
        missing = REQUIRED_NODES - set(_node_buffer.get(window_key, {}).keys())
        if missing:
            print(f"[BUFFER] Event '{window_key}' timeout, data hilang dari: {missing}")
        _node_buffer.pop(window_key, None)
        _buffer_timers.pop(window_key, None)


def _map_worst_status(statuses: list) -> str:
    """Ambil status terparah dari list status node."""
    raw = [s.upper() for s in statuses]
    if any(s in ("BAHAYA", "WARNING") for s in raw):
        return "Warning"
    if any(s in ("SIAGA",) for s in raw):
        return "Siaga"
    return "Aman"


# ==========================================
# MQTT HANDLER
# ==========================================

def on_message(client, userdata, msg):
    global IS_OVERRIDDEN

    if IS_OVERRIDDEN:
        print("[MQTT] Data diterima, diabaikan (ADMIN OVERRIDE aktif).")
        return

    try:
        payload  = json.loads(msg.payload.decode())
        node_id  = payload.get("node_id", "UNKNOWN")

        # Pastikan arrival_timestamp ada (fallback ke waktu server jika tidak ada)
        payload.setdefault("arrival_timestamp", time.time())
        payload["arrival_timestamp"] = float(payload["arrival_timestamp"])

        # Mapping status ke format tampilan
        raw_status = payload.get("status", "AMAN").upper()
        if raw_status in ("BAHAYA", "WARNING"):
            payload["status"] = "Warning"
        elif raw_status == "SIAGA":
            payload["status"] = "Siaga"
        else:
            payload["status"] = "Aman"

        # Simpan pembacaan mentah ke DB
        save_sensor_reading(payload)

        # Masukkan ke buffer lokalisasi
        window_key = _get_window_key(payload)
        with _buffer_lock:
            _node_buffer[window_key][node_id] = payload

            # Set timer cleanup (jika dalam N detik data tidak lengkap)
            if window_key not in _buffer_timers:
                timer = threading.Timer(
                    LOCALIZATION_WINDOW_SEC + 1.0,
                    _cleanup_buffer,
                    args=[window_key]
                )
                timer.daemon = True
                timer.start()
                _buffer_timers[window_key] = timer

            node_count = len(_node_buffer[window_key])

        print(
            f"[MQTT] {node_id} | "
            f"{payload['nilai_mm_s']:.4f} mm/s | "
            f"Lembap: {payload['kelembapan_pct']:.1f}% | "
            f"Status: {payload['status']} "
            f"[Buffer: {node_count}/{len(REQUIRED_NODES)}]"
        )

        # Jika semua 3 node sudah masuk, langsung lokalisasi
        if node_count >= len(REQUIRED_NODES):
            threading.Thread(target=_try_localize, args=[window_key], daemon=True).start()

    except Exception as e:
        print(f"[MQTT ERROR] {e}")


# ==========================================
# KONEKSI HIVEMQ CLOUD
# ==========================================
MQTT_BROKER   = "130e9cfdf74f4c538f0dc340a76fac23.s1.eu.hivemq.cloud"
MQTT_PORT     = 8883
MQTT_USER     = "gemastik"
MQTT_PASSWORD = "12345678"

mqtt_client = mqtt.Client()
mqtt_client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
mqtt_client.tls_set(cert_reqs=ssl.CERT_NONE)
mqtt_client.tls_insecure_set(True)
mqtt_client.on_message = on_message

try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.subscribe("sensor/gemastik/data")
    mqtt_client.loop_start()
    print("[MQTT] Terhubung ke HiveMQ Cloud!")
except Exception as e:
    print(f"[MQTT ERROR] Gagal konek ke HiveMQ Cloud: {e}")


# ==========================================
# FASTAPI APP
# ==========================================
app = FastAPI(title="Geosense EWS API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_CLIENT_ID = "154325619553-16skq2jomkno70n87nnkpptkgipakq9f.apps.googleusercontent.com"


# ==========================================
# ENDPOINT — AUTH
# ==========================================

class GoogleAuthRequest(BaseModel):
    token: str

class UserRegisterRequest(BaseModel):
    email: str
    fullname: str
    telegram: str

ADMIN_MAPS = {
    "salsabilawiryawan7@gmail.com"  : "@chocomunn",
    "s4yed.sult4n@gmail.com"        : "@username_tele_1",
    "reyhanfachrurozzi7@gmail.com"  : "@ryhnfch",
}

@app.post("/api/auth/google")
async def auth_google(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        id_info    = id_token.verify_oauth2_token(data.token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email_user = id_info.get("email")
        nama_user  = id_info.get("name")

        user_in_db = db.query(models.User).filter(models.User.email == email_user).first()

        if not user_in_db and email_user in ADMIN_MAPS:
            user_in_db = models.User(
                email    = email_user,
                fullname = nama_user,
                telegram = ADMIN_MAPS[email_user],
                role     = "admin"
            )
            db.add(user_in_db)
            db.commit()
            db.refresh(user_in_db)

        return {
            "is_new_user": user_in_db is None,
            "is_admin"   : user_in_db.role == "admin" if user_in_db else False,
            "email"      : email_user,
            "name"       : nama_user,
        }
    except ValueError:
        return {"success": False, "error": "Invalid token"}


@app.post("/api/auth/google/register")
async def register_user(data: UserRegisterRequest, db: Session = Depends(get_db)):
    new_user = models.User(
        email    = data.email,
        fullname = data.fullname,
        telegram = data.telegram,
        role     = "user"
    )
    db.add(new_user)
    db.commit()
    return {"success": True}


# ==========================================
# ENDPOINT — STATUS EWS
# ==========================================

@app.get("/api/status")
async def get_status(db: Session = Depends(get_db)):
    """Status EWS saat ini (Aman / Siaga / Warning)."""
    entry = db.query(models.SystemStatus).filter(models.SystemStatus.id == 1).first()
    return {
        "status"     : entry.status if entry else "Normal",
        "lastUpdated": entry.last_updated.strftime("%Y-%m-%d %H:%M:%S") if entry else "N/A",
        "isOverridden": IS_OVERRIDDEN,
    }


# ==========================================
# ENDPOINT — LOKALISASI SUMBER GETARAN
# ==========================================

@app.get("/api/localization/latest")
async def get_latest_localization(db: Session = Depends(get_db)):
    """
    Hasil lokalisasi sumber getaran terbaru.
    Berisi posisi sumber dalam koordinat Kartesian & Polar.
    """
    event = (
        db.query(models.SeismicEvent)
        .order_by(models.SeismicEvent.detected_at.desc())
        .first()
    )
    if not event:
        return {"success": False, "message": "Belum ada data lokalisasi"}

    return {
        "success"       : True,
        "batch_id"      : event.batch_id,
        "cartesian"     : {"x": event.source_x,  "y": event.source_y},
        "polar"         : {"r_meter": event.r_meter, "theta_deg": event.theta_deg},
        "confidence"    : event.confidence,
        "overall_status": event.overall_status,
        "reference_node": event.reference_node,
        "wave_velocity" : event.wave_velocity,
        "tdoa_ms"       : json.loads(event.tdoa_ms) if event.tdoa_ms else {},
        "detected_at"   : event.detected_at.strftime("%Y-%m-%d %H:%M:%S"),
    }


@app.get("/api/localization/history")
async def get_localization_history(limit: int = 50, db: Session = Depends(get_db)):
    """
    Riwayat lokalisasi sumber getaran (terbaru duluan).
    Berguna untuk chart scatter/polar di dashboard.
    """
    events = (
        db.query(models.SeismicEvent)
        .order_by(models.SeismicEvent.detected_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "batch_id"      : e.batch_id,
            "cartesian"     : {"x": e.source_x, "y": e.source_y},
            "polar"         : {"r_meter": e.r_meter, "theta_deg": e.theta_deg},
            "confidence"    : e.confidence,
            "overall_status": e.overall_status,
            "detected_at"   : e.detected_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for e in events
    ]


@app.get("/api/geophone/config")
async def get_geophone_config():
    """
    Informasi konfigurasi fisik array geophone.
    Berguna untuk menggambar layout sensor di peta/diagram.
    """
    return get_geophone_info()


# ==========================================
# ENDPOINT — HISTORI SENSOR
# ==========================================

@app.get("/api/sensor/history")
async def get_sensor_history(
    node_id: str = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Riwayat pembacaan sensor per node.
    Gunakan ?node_id=NODE_01 untuk filter per geophone.
    """
    query = db.query(models.SensorReading)
    if node_id:
        query = query.filter(models.SensorReading.node_id == node_id)
    readings = query.order_by(models.SensorReading.recorded_at.desc()).limit(limit).all()

    return [
        {
            "node_id"          : r.node_id,
            "arrival_timestamp": r.arrival_timestamp,
            "nilai_mm_s"       : r.nilai_mm_s,
            "kelembapan_pct"   : r.kelembapan_pct,
            "rssi"             : r.rssi,
            "status"           : r.status,
            "recorded_at"      : r.recorded_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for r in readings
    ]


# ==========================================
# ENDPOINT — ADMIN OVERRIDE
# ==========================================

@app.post("/api/admin/override")
async def override_status(status: str, db: Session = Depends(get_db)):
    """
    [Admin] Paksa ubah status EWS dan kirim perintah ke hardware.
    Saat aktif, data otomatis dari MQTT diabaikan.
    """
    global IS_OVERRIDDEN
    IS_OVERRIDDEN = True

    entry = db.query(models.SystemStatus).filter(models.SystemStatus.id == 1).first()
    if not entry:
        entry = models.SystemStatus(id=1, status=status)
        db.add(entry)
    else:
        entry.status = status
    db.commit()

    # Kirim perintah override ke hardware via MQTT
    command = json.dumps({"override_active": True, "forced_status": status})
    mqtt_client.publish("sensor/gemastik/command", command)

    return {
        "success": True,
        "message": f"Status di-override menjadi '{status}' dan dikirim ke hardware.",
    }


@app.post("/api/admin/reset-override")
async def reset_override():
    """[Admin] Lepas kunci override, kembali ke mode otomatis MQTT."""
    global IS_OVERRIDDEN
    IS_OVERRIDDEN = False
    return {"success": True, "message": "Sistem kembali ke pemantauan otomatis."}


# ==========================================
# ENDPOINT — MACHINE LEARNING
# ==========================================

@app.get("/api/ml/model-info")
async def ml_model_info():
    """
    Info model ML yang sedang aktif:
    akurasi, feature importance, tipe model.
    """
    return get_model_info()


@app.get("/api/ml/feature-importance")
async def ml_feature_importance():
    """
    Fitur sensor mana yang paling berpengaruh pada prediksi ML.
    Berguna untuk analisis dan debugging.
    """
    info = get_model_info()
    if not info.get("loaded"):
        return {"success": False, "message": "Model belum diload."}

    # Urutkan dari yang paling penting
    feat_imp = info.get("feature_importance", {})
    sorted_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))

    return {
        "success"           : True,
        "feature_importance": sorted_imp,
        "most_important"    : list(sorted_imp.keys())[0] if sorted_imp else None,
    }