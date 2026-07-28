"""
stream_csv_to_mqtt.py — Geosense Early Warning System
======================================================
Membaca dataset_longsor.csv dan men-stream setiap baris
sebagai payload JSON ke HiveMQ Cloud via MQTT + TLS.

Format payload yang dikirim per pesan:
{
    "node_id"          : "NODE_01",
    "arrival_timestamp": 1721000000.1230,   <-- waktu tiba presisi ms (dari RTC)
    "datetime"         : "2026-07-24 08:00:00",
    "nilai_mm_s"       : 0.3124,
    "kelembapan_pct"   : 47.50,
    "rssi"             : -65,
    "status"           : "AMAN",
    "batch_id"         : "a3f9e12b01"       <-- pengikat 3 node dalam 1 event
}

Urutan: ketiga node dalam 1 batch dikirim berurutan dengan jeda kecil
agar server dapat mengelompokkan dan men-trigger lokalisasi TDOA.
"""

import csv
import json
import ssl
import time

import paho.mqtt.client as mqtt

# ==========================================
# KONFIGURASI
# ==========================================
CSV_FILENAME   = "dataset_longsor.csv"
MQTT_BROKER    = "130e9cfdf74f4c538f0dc340a76fac23.s1.eu.hivemq.cloud"
MQTT_PORT      = 8883
MQTT_TOPIC     = "sensor/gemastik/data"
MQTT_USER      = "gemastik"
MQTT_PASSWORD  = "12345678"

# Jeda antar BATCH (event). Di-set kecil agar simulasi cepat.
# Set ke 1.0 atau lebih untuk simulasi real-time.
DELAY_PER_BATCH_SEC = 0.5

# Jeda antar NODE dalam 1 batch (supaya server sempat terima ketiganya)
DELAY_INTRA_BATCH_SEC = 0.05   # 50 ms


# ==========================================
# SETUP MQTT
# ==========================================
client = mqtt.Client(client_id="CSV_Data_Streamer_Geosense")
client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
client.tls_set(cert_reqs=ssl.CERT_NONE)
client.tls_insecure_set(True)

try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    print(f"[STREAMER] Terhubung ke HiveMQ Cloud ({MQTT_BROKER}:{MQTT_PORT})")
except Exception as e:
    print(f"[ERROR] Gagal terhubung ke HiveMQ Cloud: {e}")
    print("Pastikan Username & Password sudah benar di Access Management HiveMQ.")
    exit(1)


# ==========================================
# FUNGSI STREAMING
# ==========================================

def stream_data():
    """
    Baca CSV dan kirim setiap baris ke MQTT.
    Baris dengan batch_id yang sama dikirim berurutan dengan jeda kecil
    agar server dapat mengelompokkan data dari 3 geophone.
    """
    try:
        with open(CSV_FILENAME, mode='r') as f:
            reader = csv.DictReader(f)

            print(f"\n=== MULAI STREAMING: '{CSV_FILENAME}' → HiveMQ Cloud ===")
            print("Tekan CTRL+C untuk menghentikan.\n")

            current_batch = None
            batch_count   = 0
            row_count     = 0

            for row in reader:
                row_count += 1
                batch_id = row.get("batch_id", "")

                # Jika batch baru dimulai, tunggu sebentar antar batch
                if batch_id != current_batch:
                    if current_batch is not None:
                        time.sleep(DELAY_PER_BATCH_SEC)
                    current_batch = batch_id
                    batch_count  += 1
                else:
                    # Dalam 1 batch, jeda kecil antar node
                    time.sleep(DELAY_INTRA_BATCH_SEC)

                # Susun payload JSON
                payload = {
                    "node_id"          : row["node_id"],
                    "arrival_timestamp": float(row["arrival_timestamp"]),
                    "datetime"         : row["datetime_readable"],
                    "nilai_mm_s"       : float(row["nilai_mm_s"]),
                    "kelembapan_pct"   : float(row["kelembapan_pct"]),
                    "rssi"             : int(row["rssi"]),
                    "status"           : row["status"],
                    "batch_id"         : batch_id,
                }

                client.publish(MQTT_TOPIC, json.dumps(payload))

                print(
                    f"[Batch {batch_count:>5} | {row['node_id']}] "
                    f"{row['datetime_readable']} | "
                    f"Getaran: {payload['nilai_mm_s']:.4f} mm/s | "
                    f"Lembap: {payload['kelembapan_pct']:.1f}% | "
                    f"Status: {payload['status']}"
                )

        print(f"\n[STREAMER] Selesai. Total {row_count} baris ({batch_count} event) dikirim.")

    except FileNotFoundError:
        print(f"[ERROR] File '{CSV_FILENAME}' tidak ditemukan!")
        print("Jalankan terlebih dahulu: python dataset_longsor.py")
    except KeyboardInterrupt:
        print("\n[STREAMER] Dihentikan oleh user.")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    stream_data()