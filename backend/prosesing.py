"""
prosesing.py — Geosense Early Warning System
=============================================
Gateway untuk jalur HARDWARE NYATA (ESP32 via Serial COM).
Membaca JSON dari port Serial, mengklasifikasikan status,
menyimpan ke database, dan mem-publish ke MQTT untuk diproses main.py.

Format JSON yang diharapkan dari ESP32:
{
    "node": "NODE_01",
    "value": 12500,           <-- nilai ADC raw dari geophone
    "hum": 67.5,              <-- kelembapan tanah (%)
    "ts": 1721000000123       <-- timestamp RTC dalam milidetik
}
"""

import json
import serial
import paho.mqtt.client as mqtt
import ssl
import time

from database import SessionLocal
import models

# ==========================================
# KONFIGURASI
# ==========================================
SERIAL_PORT  = 'COM3'
BAUD_RATE    = 115200

MQTT_BROKER  = "130e9cfdf74f4c538f0dc340a76fac23.s1.eu.hivemq.cloud"
MQTT_PORT    = 8883
MQTT_TOPIC   = "sensor/gemastik/data"
MQTT_USER    = "gemastik"
MQTT_PASSWORD = "12345678"

# Konstanta konversi ADC → mm/s
# Sesuaikan dengan spesifikasi geophone & ADC yang digunakan
ADC_FULL_SCALE   = 2 ** 23 - 1   # Untuk ADC 24-bit
VOLTAGE_REF      = 3.3            # Volt
MAX_VELOCITY_MMS = 28.8           # mm/s pada full scale


# ==========================================
# INISIALISASI DATABASE
# ==========================================
# Pastikan tabel sudah ada (buat jika belum)
models.Base.metadata.create_all(bind=__import__('database').engine)


# ==========================================
# FUNGSI KLASIFIKASI (3-LEVEL)
# ==========================================
def classify_status(mms: float, hum: float) -> str:
    """
    Klasifikasi status bahaya 3-level.
    KONSISTEN dengan dataset_longsor.py dan localization.py.

    Args:
        mms : kecepatan getaran di node (mm/s)
        hum : kelembapan tanah (%)

    Returns:
        "BAHAYA" | "SIAGA" | "AMAN"
    """
    if mms >= 5.0 and hum > 80.0:
        return "BAHAYA"
    elif mms >= 2.0 or hum > 70.0:
        return "SIAGA"
    else:
        return "AMAN"


def adc_to_mms(raw_adc: int) -> float:
    """Konversi nilai ADC raw ke kecepatan getaran (mm/s)."""
    voltage = (abs(raw_adc) / ADC_FULL_SCALE) * VOLTAGE_REF
    mms     = (voltage / VOLTAGE_REF) * MAX_VELOCITY_MMS
    return round(mms, 4)


# ==========================================
# FUNGSI PEMROSESAN DATA
# ==========================================
def process_json_data(json_str: str, mqtt_client: mqtt.Client):
    """
    Proses satu baris JSON dari Serial, simpan ke DB, dan publish ke MQTT.

    Args:
        json_str    : String JSON dari ESP32
        mqtt_client : Instance MQTT untuk publish
    """
    try:
        data    = json.loads(json_str)
        node_id = data.get("node", "UNKNOWN")
        raw_val = int(data.get("value", 0))
        hum     = float(data.get("hum", 0.0))
        # Timestamp RTC dari ESP32 (dalam milidetik → konversi ke detik float)
        ts_ms   = data.get("ts", None)
        arrival_ts = (ts_ms / 1000.0) if ts_ms else time.time()

        # Konversi ADC → mm/s
        mms    = adc_to_mms(raw_val)
        status = classify_status(mms, hum)

        # Simpan ke database (tabel sensor_readings di geosense.db)
        db = SessionLocal()
        try:
            reading = models.SensorReading(
                batch_id          = "",        # Hardware tidak punya batch_id; main.py pakai time-window
                node_id           = node_id,
                arrival_timestamp = arrival_ts,
                nilai_mm_s        = mms,
                kelembapan_pct    = hum,
                status            = status,
            )
            db.add(reading)
            db.commit()
        finally:
            db.close()

        # Publish ke HiveMQ Cloud (sama topik dengan streamer CSV)
        payload = {
            "node_id"          : node_id,
            "arrival_timestamp": arrival_ts,
            "nilai_mm_s"       : mms,
            "kelembapan_pct"   : hum,
            "rssi"             : data.get("rssi", None),
            "status"           : status,
            # batch_id tidak ada dari hardware — main.py akan pakai time-window
        }
        mqtt_client.publish(MQTT_TOPIC, json.dumps(payload))

        status_icon = {"BAHAYA": "🔴", "SIAGA": "🟡", "AMAN": "🟢"}.get(status, "⚪")
        print(f"[SERIAL] {node_id} | {mms:.4f} mm/s | Lembap: {hum:.1f}% | {status_icon} {status}")

    except json.JSONDecodeError:
        print(f"[SERIAL] Bukan JSON valid: {json_str}")
    except Exception as e:
        print(f"[ERROR] Gagal proses data: {e}")


# ==========================================
# MAIN LOOP
# ==========================================
if __name__ == "__main__":
    # Setup MQTT ke HiveMQ Cloud
    client = mqtt.Client(client_id="Serial_Gateway_Geosense")
    client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
    client.tls_set(cert_reqs=__import__('ssl').CERT_NONE)
    client.tls_insecure_set(True)

    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        print(f"[MQTT] Terhubung ke HiveMQ Cloud.")
    except Exception as e:
        print(f"[MQTT] Gagal konek: {e}. Lanjut tanpa MQTT.")

    # Buka koneksi Serial ke ESP32
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"[SERIAL] Mendengarkan di {SERIAL_PORT} @ {BAUD_RATE} baud...")
        print("Tekan CTRL+C untuk berhenti.\n")

        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()

                if line:
                    print(f"[RAW] {line}")

                # Hanya proses jika format JSON { ... }
                if line.startswith('{') and line.endswith('}'):
                    process_json_data(line, client)

    except serial.SerialException as e:
        print(f"[ERROR] Gagal membuka {SERIAL_PORT}: {e}")
        print("Pastikan ESP32 terhubung dan port COM sudah benar.")
    except KeyboardInterrupt:
        print("\n[SERIAL] Dihentikan oleh user.")
    finally:
        try:
            ser.close()
        except Exception:
            pass
        client.loop_stop()
        client.disconnect()