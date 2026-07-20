import csv
import json
import time
import ssl
import paho.mqtt.client as mqtt

# --- KONFIGURASI HIVEMQ CLOUD ---
CSV_FILENAME = "dataset_longsor.csv"
MQTT_BROKER = "130e9cfdf74f4c538f0dc340a76fac23.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_TOPIC = "sensor/gemastik/data"

# ⬇️ ISI DENGAN USERNAME & PASSWORD DARI ACCESS MANAGEMENT HIVEMQ ⬇️
MQTT_USER = "gemastik"
MQTT_PASSWORD = "12345678"

DELAY_DETIK = 0.5  # Jeda kirim data per baris (dalam detik)

# --- SETUP MQTT CLIENT DENGAN TLS & KREDENSIAL ---
client = mqtt.Client(client_id="CSV_Data_Streamer")

# Set Username dan Password
client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

# Set SSL/TLS (Wajib untuk HiveMQ Cloud Port 8883)
client.tls_set(cert_reqs=ssl.CERT_NONE)
client.tls_insecure_set(True)

try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    print(f"[STREAMER] Berhasil terhubung ke HiveMQ Cloud ({MQTT_BROKER})!")
except Exception as e:
    print(f"[ERROR] Gagal terhubung ke HiveMQ Cloud: {e}")
    print("Pastikan Username & Password yang dimasukkan sudah sesuai dengan di Access Management!")
    exit()

def stream_data():
    try:
        with open(CSV_FILENAME, mode='r') as file:
            reader = csv.DictReader(file)
            print(f"=== MULAI STREAMING DATA DARI '{CSV_FILENAME}' KE HIVEMQ CLOUD ===")
            print("Tekan CTRL+C untuk menghentikan.\n")
            
            count = 0
            for row in reader:
                count += 1
                
                # Format payload JSON
                payload = {
                    "node_id": row["node_id"],
                    "timestamp": int(row["timestamp"]),
                    "datetime": row["datetime_readable"],
                    "nilai_mm_s": float(row["nilai_mm_s"]),
                    "kelembapan_pct": float(row["kelembapan_pct"]),
                    "status": row["status"]
                }
                
                # Publish ke HiveMQ Cloud
                client.publish(MQTT_TOPIC, json.dumps(payload))
                
                print(f"[{count}] {row['datetime_readable']} | Getaran: {payload['nilai_mm_s']} mm/s | Lembap: {payload['kelembapan_pct']}% | Status: {payload['status']}")
                
                time.sleep(DELAY_DETIK)

    except FileNotFoundError:
        print(f"[ERROR] File '{CSV_FILENAME}' tidak ditemukan!")
        print("Jalankan 'python dataset_longsor.py' terlebih dahulu!")
    except KeyboardInterrupt:
        print("\n[STREAMER] Streaming dihentikan oleh user.")
        client.disconnect()

if __name__ == "__main__":
    stream_data()