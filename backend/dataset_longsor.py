import csv
import random
import time
from datetime import datetime, timedelta

# Konfigurasi File
FILENAME = "dataset_longsor.csv"
NODE_ID = "NODE_01"

def classify_status(mms, hum):
    """Fungsi ini disamakan persis dengan logika Gateway"""
    if mms >= 5.0 and hum > 80.0: return "BAHAYA"
    elif mms >= 2.0 or hum > 70.0: return "SIAGA"
    else: return "AMAN"

def generate_dummy_data():
    data = []
    # Set waktu mulai (5 hari yang lalu)
    start_time = datetime.now() - timedelta(days=5)
    
    print("Mulai membuat data dummy (mensimulasikan 5 hari penuh)...")

    # Simulasi pembacaan setiap 1 menit selama 5 hari (~7200 baris data)
    for i in range(5 * 24 * 60):
        current_time = start_time + timedelta(minutes=i)
        ts = int(current_time.timestamp())
        
        # --- SKENARIO PERUBAHAN FISIK TANAH ---
        if i < 2880: 
            # HARI 1 & 2: Normal
            kelembapan = random.uniform(40.0, 55.0)
            getaran = random.uniform(0.1, 0.5)
        elif i < 4320:
            # HARI 3: Hujan mulai turun
            kelembapan = random.uniform(55.0, 75.0)
            getaran = random.uniform(0.5, 1.8)
        elif i < 5760:
            # HARI 4: SIAGA (Pergerakan mikro)
            kelembapan = random.uniform(75.0, 85.0)
            getaran = random.uniform(1.8, 3.5)
        elif i < 7150:
            # HARI 5 (Awal): Kondisi Kritis
            kelembapan = random.uniform(85.0, 92.0)
            getaran = random.uniform(3.0, 4.8)
        else:
            # HARI 5 (Akhir): BAHAYA / LONGSOR (50 menit terakhir)
            kelembapan = random.uniform(90.0, 98.0)
            getaran = random.uniform(5.5, 12.0)

        # Noise acak
        kelembapan += random.uniform(-1.0, 1.0)
        getaran += random.uniform(-0.2, 0.2)
        
        kelembapan = min(max(kelembapan, 0.0), 100.0)
        getaran = max(getaran, 0.0)

        status = classify_status(getaran, kelembapan)
        
        raw_adc = int((getaran / 28.8) * 100 * ((2**23 - 1) / 3.3)) 
        rssi = random.randint(-85, -45)

        data.append([NODE_ID, ts, current_time.strftime("%Y-%m-%d %H:%M:%S"), raw_adc, round(getaran, 3), round(kelembapan, 2), rssi, status])

    # Tulis ke file CSV
    with open(FILENAME, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["node_id", "timestamp", "datetime_readable", "raw_adc", "nilai_mm_s", "kelembapan_pct", "rssi", "status"])
        writer.writerows(data)

    print(f"Selesai! Berhasil membuat {len(data)} baris data di '{FILENAME}'.")

if __name__ == "__main__":
    generate_dummy_data()