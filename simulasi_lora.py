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
MQTT_BROKER = "127.0.0.1"  
MQTT_PORT = 1883
MQTT_TOPIC = "sensor/gemastik/data"
TELEGRAM_TOKEN = "8739691017:AAHCXm36fPfNaxfraNIcuYpzj4v1kUMlRrE" 
TELEGRAM_CHAT_ID = "7282166909"                                   

# --- 3. VARIABEL GLOBAL ---
signal_buffer = deque(maxlen=BUFFER_SIZE)
previous_status = "AMAN"
# Kita tambahkan parameter api_version untuk menghilangkan warning
mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="Gateway_Utama_Simulasi")

# --- 4. FUNGSI DATABASE (SQLITE) ---
def setup_database():
    conn = sqlite3.connect('longsor_data.db')
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS sensor_data (id INTEGER PRIMARY KEY AUTOINCREMENT, node_id TEXT, timestamp INTEGER, raw_adc INTEGER, nilai_mm_s REAL, status TEXT, rssi INTEGER)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, node_id TEXT, timestamp INTEGER, nilai_mm_s REAL, status TEXT, jenis_event TEXT, keterangan TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS devices (node_id TEXT PRIMARY KEY, status_perangkat TEXT, last_seen INTEGER)''')
    conn.commit()
    conn.close()
    print("[DB] Database SQLite 'longsor_data.db' siap.")

def save_to_db(table, data_dict):
    conn = sqlite3.connect('longsor_data.db')
    cursor = conn.cursor()
    columns = ', '.join(data_dict.keys())
    placeholders = ', '.join(['?'] * len(data_dict))
    values = tuple(data_dict.values())
    query = f"INSERT OR REPLACE INTO {table} ({columns}) VALUES ({placeholders})"
    cursor.execute(query, values)
    conn.commit()
    conn.close()

# --- 5. FUNGSI TELEGRAM ---
def send_telegram_alert(pesan):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": pesan, "parse_mode": "Markdown"}
    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code == 200:
            print("[TELEGRAM] Berhasil mengirim peringatan ke HP Anda!")
        else:
            print(f"[TELEGRAM ERROR] {response.text}")
    except Exception as e:
        print(f"[ERROR] Gagal kirim Telegram: {e}")

# --- 6. PEMROSESAN FISIKA (DSP) ---
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
        parts = raw_lora_payload.strip().split(',')
        if len(parts) != 4: return 
        
        node_id, timestamp, adc_value, rssi = parts[0], int(parts[1]), int(parts[2]), int(parts[3])
        
        raw_mms = convert_to_mms(adc_value)
        filtered_mms = moving_average_filter(raw_mms)
        current_status = classify_status(filtered_mms)
        
        event_type = "UPDATE_RUTIN"
        if current_status != previous_status:
            event_type = f"TRANSISI_{previous_status}_KE_{current_status}"
            previous_status = current_status
            
            # Jika BAHAYA, bunyikan alarm ke Telegram!
            if current_status == "BAHAYA":
                msg = f"⚠️ *PERINGATAN LONGSOR* ⚠️\nLokasi: {node_id}\nGetaran: {round(filtered_mms, 2)} mm/s"
                send_telegram_alert(msg)
            
            save_to_db("events", {"node_id": node_id, "timestamp": timestamp, "nilai_mm_s": filtered_mms, "status": current_status, "jenis_event": event_type, "keterangan": "Perubahan Status"})

        save_to_db("sensor_data", {"node_id": node_id, "timestamp": timestamp, "raw_adc": adc_value, "nilai_mm_s": filtered_mms, "status": current_status, "rssi": rssi})
        save_to_db("devices", {"node_id": node_id, "status_perangkat": "ONLINE", "last_seen": timestamp})

        # --- DISTRIBUSI KE WEB DASHBOARD (MQTT) ---
        mqtt_payload = {
            "node_id": node_id, "timestamp": timestamp, 
            "nilai_mm_s": round(filtered_mms, 3), "status": current_status
        }
        mqtt_client.publish(MQTT_TOPIC, json.dumps(mqtt_payload))

        print(f"[OK] {node_id} | ADC: {adc_value} -> {round(filtered_mms, 2)} mm/s | Status: {current_status}")

    except Exception as e:
        print(f"[ERROR] Payload cacat: {e}")

# --- 8. PROGRAM START (MODE SIMULASI) ---
if __name__ == "__main__":
    print("=== Memulai Gateway Processing TIE (MODE SIMULASI) ===")
    setup_database()
    
    # Mencoba koneksi ke Mosquitto MQTT Broker
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        print("[MQTT] Menara Pemancar (Mosquitto) Terhubung!\n")
    except Exception as e:
        print(f"[WARNING] MQTT Broker belum menyala. Error: {e}\n")
    
    print("[INFO] Memulai Injeksi Data LoRa Simulasi dalam 2 detik...\n")
    time.sleep(2)
    
    try:
        # Skenario Simulasi BARU: Getaran tanah level GEMPA!
        data_dummy = [
            "NODE01,1718112001,50000,-45",       # Data 1: Aman
            "NODE01,1718112002,25000000,-46",    # Data 2: Tiba-tiba getaran hebat (Naik ke SIAGA)
            "NODE01,1718112003,60000000,-45",    # Data 3: Ekstrem! (Pasti BAHAYA & Telegram Terkirim)
            "NODE01,1718112004,80000000,-47",    # Data 4: Sangat Ekstrem
            "NODE01,1718112005,80000000,-48"     # Data 5: Sangat Ekstrem
        ]
        
        for teks_lora in data_dummy:
            print(f"[RADIO] Menerima data pura-pura: {teks_lora}")
            process_and_distribute(teks_lora)
            time.sleep(2) # Jeda 2 detik antar data
            
        print("\n=== SIMULASI SELESAI ===")
        
    except Exception as e:
        print(f"[FATAL ERROR] Sistem berhenti: {e}")