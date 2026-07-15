import serial
import json
import time
import requests
import sqlite3
import paho.mqtt.client as mqtt
from collections import deque

# --- 1. KONFIGURASI SISTEM & FISIKA ---
V_REF = 3.3
GAIN = 100
SENSITIVITY = 28.8
BUFFER_SIZE = 10

# --- 2. KONFIGURASI JARINGAN & API ---
SERIAL_PORT = '/dev/ttyS3' # Ubah ke 'COM3' dll jika dites di Windows
BAUD_RATE = 9600
MQTT_BROKER = "127.0.0.1"  # IP localhost jika broker di alat yang sama
MQTT_PORT = 1883
MQTT_TOPIC = "sensor/gemastik/data"
TELEGRAM_TOKEN = "8739691017:AAHCXm36fPfNaxfraNIcuYpzj4v1kUMlRrE"
TELEGRAM_CHAT_ID = "7282166909"

# --- 3. VARIABEL GLOBAL ---
signal_buffer = deque(maxlen=BUFFER_SIZE)
previous_status = "AMAN"
mqtt_client = mqtt.Client(client_id="Gateway_Utama")

# --- 4. FUNGSI DATABASE (SQLITE) ---
def setup_database():
    """Membuat tabel SQL sesuai arsitektur jika belum ada"""
    conn = sqlite3.connect('longsor_data.db')
    cursor = conn.cursor()
    
    # Tabel sensor_data
    cursor.execute('''CREATE TABLE IF NOT EXISTS sensor_data
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, node_id TEXT, 
                       timestamp INTEGER, raw_adc INTEGER, nilai_mm_s REAL, 
                       status TEXT, rssi INTEGER)''')
    
    # Tabel events
    cursor.execute('''CREATE TABLE IF NOT EXISTS events
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, node_id TEXT, 
                       timestamp INTEGER, nilai_mm_s REAL, status TEXT, 
                       jenis_event TEXT, keterangan TEXT)''')
    
    # Tabel devices
    cursor.execute('''CREATE TABLE IF NOT EXISTS devices
                      (node_id TEXT PRIMARY KEY, status_perangkat TEXT, last_seen INTEGER)''')
    
    conn.commit()
    conn.close()
    print("[DB] Database SQLite 'longsor_data.db' siap.")

def save_to_db(table, data_dict):
    """Fungsi dinamis untuk insert data ke tabel SQL"""
    conn = sqlite3.connect('longsor_data.db')
    cursor = conn.cursor()
    
    columns = ', '.join(data_dict.keys())
    placeholders = ', '.join(['?'] * len(data_dict))
    values = tuple(data_dict.values())
    
    query = f"INSERT OR REPLACE INTO {table} ({columns}) VALUES ({placeholders})"
    cursor.execute(query, values)
    conn.commit()
    conn.close()

# --- 5. FUNGSI KOMUNIKASI EKSTERNAL ---
def send_telegram_alert(pesan):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": pesan, "parse_mode": "Markdown"}
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print(f"[ERROR] Gagal kirim Telegram: {e}")

# --- 6. FUNGSI PEMROSESAN FISIKA (DSP) ---
def convert_to_mms(adc_value):
    v_in = (adc_value / (2**23 - 1)) * V_REF
    v_in_real = v_in / GAIN
    return abs(SENSITIVITY * v_in_real)

def moving_average_filter(new_value):
    signal_buffer.append(new_value)
    return sum(signal_buffer) / len(signal_buffer)

def classify_status(value_mms):
    if value_mms < 2.0: return "AMAN"
    elif 2.0 <= value_mms < 5.0: return "SIAGA"
    else: return "BAHAYA"

# --- 7. PIPELINE UTAMA ---
def process_and_distribute(raw_lora_payload):
    global previous_status
    try:
        # TAHAP 1: Parsing
        parts = raw_lora_payload.strip().split(',')
        if len(parts) != 4: return 
        
        node_id, timestamp, adc_value, rssi = parts[0], int(parts[1]), int(parts[2]), int(parts[3])
        
        # TAHAP 2 & 3: Konversi & Filter
        raw_mms = convert_to_mms(adc_value)
        filtered_mms = moving_average_filter(raw_mms)
        
        # TAHAP 4: Klasifikasi
        current_status = classify_status(filtered_mms)
        
        # TAHAP 5: Event Generation
        event_type = "UPDATE_RUTIN"
        if current_status != previous_status:
            event_type = f"TRANSISI_{previous_status}_KE_{current_status}"
            previous_status = current_status
            
            # TRIGGER ALERT!
            if current_status == "BAHAYA":
                msg = f"⚠️ *PERINGATAN LONGSOR* ⚠️\nLokasi: {node_id}\nGetaran: {round(filtered_mms, 2)} mm/s"
                send_telegram_alert(msg)
            
            # Catat ke tabel 'events'
            save_to_db("events", {
                "node_id": node_id, "timestamp": timestamp, "nilai_mm_s": filtered_mms,
                "status": current_status, "jenis_event": event_type, "keterangan": "Perubahan Status"
            })

        # --- DISTRIBUSI DATA ---
        # 1. Simpan ke database 'sensor_data' & update 'devices'
        save_to_db("sensor_data", {
            "node_id": node_id, "timestamp": timestamp, "raw_adc": adc_value,
            "nilai_mm_s": filtered_mms, "status": current_status, "rssi": rssi
        })
        save_to_db("devices", {"node_id": node_id, "status_perangkat": "ONLINE", "last_seen": timestamp})

        # 2. Publish ke MQTT (Untuk Web Dashboard)
        mqtt_payload = {
            "node_id": node_id, "timestamp": timestamp, 
            "nilai_mm_s": round(filtered_mms, 3), "status": current_status
        }
        mqtt_client.publish(MQTT_TOPIC, json.dumps(mqtt_payload))
        
        print(f"[OK] {node_id} | {round(filtered_mms, 2)} mm/s | {current_status}")

    except Exception as e:
        print(f"[ERROR] Payload cacat/gagal proses: {e}")

# --- 8. PROGRAM START ---
if __name__ == "__main__":
    print("=== Memulai Gateway Processing TIE ===")
    setup_database()
    
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
    except:
        print("[WARNING] MQTT Broker belum menyala, lanjut tanpa MQTT.")

    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"[INFO] Mendengarkan LoRa di {SERIAL_PORT}...")
        while True:
            if ser.in_waiting > 0:
                raw_data = ser.readline().decode('utf-8', errors='ignore')
                process_and_distribute(raw_data)
            time.sleep(0.01)
    except Exception as e:
        print(f"[FATAL ERROR] Port Serial: {e}")