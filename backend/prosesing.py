import serial
import json
import time
import requests
import sqlite3
import paho.mqtt.client as mqtt
from collections import deque

# ==========================================
# 1. KONFIGURASI SISTEM & FISIKA
# ==========================================
V_REF = 3.3
GAIN = 100
SENSITIVITY = 28.8
BUFFER_SIZE = 10
VALIDASI_BAHAYA = 3  # Butuh 3x deteksi berturut-turut agar sah dianggap longsor

# ==========================================
# 2. KONFIGURASI JARINGAN, SERIAL & API
# ==========================================
SERIAL_PORT = 'COM3'  # Sesuaikan dengan port di Device Manager Anda
BAUD_RATE = 9600

MQTT_BROKER = "127.0.0.1"  
MQTT_PORT = 1883
MQTT_TOPIC = "sensor/gemastik/data"

# Token Bot & Chat ID Telegram
TELEGRAM_TOKEN = "8739691017:AAHCXm36fPfNaxfraNIcuYpzj4v1kUMlRrE"
TELEGRAM_CHAT_ID = "7282166909"

# ==========================================
# 3. VARIABEL GLOBAL
# ==========================================
signal_buffer = deque(maxlen=BUFFER_SIZE)
previous_status = "AMAN"
danger_counter = 0  # Counter untuk mencegah False-Alarm
mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="Gateway_Utama_TIE")

# ==========================================
# 4. FUNGSI DATABASE (SQLITE)
# ==========================================
def setup_database():
    """Membuat tabel database untuk menyimpan semua history (Dataset ML)"""
    conn = sqlite3.connect('longsor_data.db')
    cursor = conn.cursor()
    
    # Tabel data mentah sensor
    cursor.execute('''CREATE TABLE IF NOT EXISTS sensor_data
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, node_id TEXT, 
                       timestamp INTEGER, raw_adc INTEGER, nilai_mm_s REAL, 
                       kelembapan REAL, status TEXT, rssi INTEGER)''')
    
    # Tabel khusus untuk mencatat event alarm
    cursor.execute('''CREATE TABLE IF NOT EXISTS events
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, node_id TEXT, 
                       timestamp INTEGER, nilai_mm_s REAL, status TEXT, 
                       jenis_event TEXT, keterangan TEXT)''')
    
    # Tabel status perangkat aktif
    cursor.execute('''CREATE TABLE IF NOT EXISTS devices
                      (node_id TEXT PRIMARY KEY, status_perangkat TEXT, last_seen INTEGER)''')
    
    conn.commit()
    conn.close()
    print("[DB] Database SQLite 'longsor_data.db' siap untuk Machine Learning.")

def save_to_db(table, data_dict):
    """Menyimpan data ke tabel SQL secara dinamis"""
    conn = sqlite3.connect('longsor_data.db')
    cursor = conn.cursor()
    columns = ', '.join(data_dict.keys())
    placeholders = ', '.join(['?'] * len(data_dict))
    values = tuple(data_dict.values())
    query = f"INSERT OR REPLACE INTO {table} ({columns}) VALUES ({placeholders})"
    cursor.execute(query, values)
    conn.commit()
    conn.close()

# ==========================================
# 5. FUNGSI NOTIFIKASI
# ==========================================
def send_telegram_alert(pesan):
    """Mengirim pesan peringatan ke Telegram"""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": pesan, "parse_mode": "Markdown"}
    try:
        requests.post(url, json=payload, timeout=5)
        print("[TELEGRAM] Peringatan berhasil dikirim!")
    except Exception as e:
        print(f"[ERROR] Gagal kirim Telegram: {e}")

# ==========================================
# 6. FUNGSI PEMROSESAN FISIKA (DSP & LOGIKA)
# ==========================================
def convert_to_mms(adc_value):
    """Mengonversi nilai raw ADC ke satuan mm/s"""
    v_in = (adc_value / (2**23 - 1)) * V_REF
    v_in_real = v_in / GAIN
    return abs(SENSITIVITY * v_in_real)

def moving_average_filter(new_value):
    """Menghaluskan sinyal getaran (Meredam noise elektrik)"""
    signal_buffer.append(new_value)
    return sum(signal_buffer) / len(signal_buffer)

def classify_raw_status(value_mms, kelembapan):
    """Logika Sensor Fusion: Mencocokkan Getaran & Kelembapan"""
    if value_mms >= 5.0 and kelembapan > 80.0: 
        return "BAHAYA"
    elif value_mms >= 2.0 or kelembapan > 70.0: 
        return "SIAGA"
    else: 
        return "AMAN"

# ==========================================
# 7. PIPELINE UTAMA (DATA INGESTION)
# ==========================================
def process_and_distribute(raw_lora_payload):
    global previous_status, danger_counter
    try:
        # 1. Parsing Data CSV dari STM32/ESP32 (Wajib 5 bagian)
        parts = raw_lora_payload.strip().split(',')
        if len(parts) != 5: return 
        
        node_id = parts[0]
        timestamp = int(parts[1])
        adc_value = int(parts[2])
        rssi = int(parts[3])
        kelembapan = float(parts[4])
        
        # 2. Konversi & Filter Getaran
        raw_mms = convert_to_mms(adc_value)
        filtered_mms = moving_average_filter(raw_mms)
        
        # 3. Klasifikasi Mentah
        raw_status = classify_raw_status(filtered_mms, kelembapan)
        
        # 4. Time-Window Filtering (Anti-False Alarm)
        if raw_status == "BAHAYA":
            danger_counter += 1
        else:
            danger_counter = 0  # Reset jika ancaman hilang
            
        # Penentuan Status Final
        if danger_counter >= VALIDASI_BAHAYA:
            current_status = "BAHAYA"
        elif raw_status == "SIAGA":
            current_status = "SIAGA"
        else:
            current_status = "AMAN"
            
        # 5. Pemicu Event & Telegram
        event_type = "UPDATE_RUTIN"
        if current_status != previous_status:
            event_type = f"TRANSISI_{previous_status}_KE_{current_status}"
            previous_status = current_status
            
            if current_status == "BAHAYA":
                msg = f"⚠️ *PERINGATAN DINI LONGSOR!* ⚠️\nLokasi: {node_id}\nGetaran Tanah: {round(filtered_mms, 2)} mm/s\nKelembapan Tanah: {kelembapan}% (Jenuh Air)\n\n_Segera lakukan evakuasi!_"
                send_telegram_alert(msg)
            
            # Catat log transisi status
            save_to_db("events", {
                "node_id": node_id, "timestamp": timestamp, "nilai_mm_s": filtered_mms,
                "status": current_status, "jenis_event": event_type, "keterangan": "Perubahan Status"
            })

        # 6. Simpan ke Database (Dataset untuk ML)
        save_to_db("sensor_data", {
            "node_id": node_id, "timestamp": timestamp, "raw_adc": adc_value,
            "nilai_mm_s": filtered_mms, "kelembapan": kelembapan, 
            "status": current_status, "rssi": rssi
        })
        save_to_db("devices", {"node_id": node_id, "status_perangkat": "ONLINE", "last_seen": timestamp})

        # 7. Publish ke MQTT (Untuk Web Dashboard Frontend)
        mqtt_payload = {
            "node_id": node_id, "timestamp": timestamp, 
            "nilai_mm_s": round(filtered_mms, 3), "kelembapan": kelembapan,
            "status": current_status
        }
        mqtt_client.publish(MQTT_TOPIC, json.dumps(mqtt_payload))
        
        print(f"[DATA] {node_id} | Getaran: {round(filtered_mms, 2)} | Kelembapan: {kelembapan}% | STATUS: {current_status} (Trig: {danger_counter}/{VALIDASI_BAHAYA})")

    except Exception as e:
        pass # Mengabaikan data radio/serial yang korup di tengah jalan

# ==========================================
# 8. PROGRAM UTAMA BERJALAN
# ==========================================
if __name__ == "__main__":
    print("=====================================================")
    print("  SYSTEM GATEWAY TIE - IoT & Prediksi Longsor Aktif  ")
    print("=====================================================")
    
    # Inisialisasi Database
    setup_database()
    
    # Koneksi ke Mosquitto MQTT
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        print("[MQTT] Terhubung ke Broker Dashboard.")
    except Exception as e:
        print(f"[WARNING] MQTT Broker (Mosquitto) belum menyala: {e}")

    # Membuka Koneksi Serial ke STM32/ESP32
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"[INFO] Mendengarkan LoRa Fisik di {SERIAL_PORT}...")
        print("Menunggu data masuk...\n")
        
        while True:
            if ser.in_waiting > 0:
                # Membaca data mentah dari port serial (USB)
                raw_data = ser.readline().decode('utf-8', errors='ignore')
                process_and_distribute(raw_data)
            time.sleep(0.01)
            
    except serial.SerialException as e:
        print(f"\n[FATAL ERROR] Gagal membuka port {SERIAL_PORT}.")
        print("Pastikan:")
        print("1. Kabel USB/Data sudah tercolok dengan baik.")
        print("2. Nomor COM port di kode sama dengan di Device Manager.")
        print("3. Aplikasi Arduino IDE / Serial Monitor SUDAH DITUTUP.")