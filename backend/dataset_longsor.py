"""
dataset_longsor.py — Geosense Early Warning System
===================================================
Generator data dummy untuk simulasi 3 geophone (NODE_01, NODE_02, NODE_03)
selama 5 hari menuju kondisi longsor.

Fisika yang disimulasikan:
  - Setiap menit ada 1 "event" getaran dengan posisi sumber acak
  - Waktu tiba di setiap geophone dihitung dari: jarak / kecepatan gelombang
  - Amplitudo berkurang dengan jarak: A(d) = A_sumber / (1 + k * d)
  - Ditambah noise RTC ±0.5 ms untuk simulasi ketidakakuratan jam

Output: dataset_longsor.csv  (~21.600 baris = 7.200 event × 3 geophone)
"""

import csv
import math
import random
import uuid
from datetime import datetime, timedelta

# ==========================================
# KONFIGURASI
# ==========================================
FILENAME      = "dataset_longsor.csv"
WAVE_VELOCITY = 300.0                    # m/s — kecepatan gelombang seismik
RTC_NOISE_SEC = 0.0005                   # ±0.5 ms noise RTC

_SQRT3 = math.sqrt(3)

# Posisi geophone (meter) — segitiga sama sisi, sisi 2 meter
GEOPHONE_POSITIONS = {
    "NODE_01": (0.0,        0.0),
    "NODE_02": (2.0,        0.0),
    "NODE_03": (1.0,    _SQRT3),         # ≈ (1.0, 1.7321)
}

# Centroid segitiga (pusat referensi polar)
CENTER = (1.0, _SQRT3 / 3.0)            # ≈ (1.0, 0.5774)


# ==========================================
# FUNGSI HELPER
# ==========================================

def _distance(p1: tuple, p2: tuple) -> float:
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def classify_status(mms_sumber: float, hum: float) -> str:
    """
    Klasifikasi 3-level berdasarkan getaran sumber dan kelembapan.
    Konsisten dengan logika di localization.py dan prosesing.py.
    """
    if mms_sumber >= 5.0 and hum > 80.0:
        return "BAHAYA"
    elif mms_sumber >= 2.0 or hum > 70.0:
        return "SIAGA"
    else:
        return "AMAN"


def _amplitude_at_node(mms_sumber: float, src: tuple, node_pos: tuple) -> float:
    """
    Hitung amplitudo di node berdasarkan jarak dari sumber.
    Menggunakan model geometrical spreading: A ∝ 1 / (1 + k*d)
    """
    d = _distance(src, node_pos)
    k = 0.4   # faktor atenuasi (disesuaikan dengan jarak 2m antar node)
    return mms_sumber / (1.0 + k * d)


def _random_source_position(phase: int) -> tuple:
    """
    Hasilkan posisi sumber getaran acak dari luar segitiga sensor.
    Semakin parah fase, semakin dekat ke sensor.

    Phase: 0=Normal, 1=Hujan, 2=Siaga, 3=Kritis, 4=Bahaya
    """
    jarak_rentang = {
        0: (20.0, 60.0),   # Normal  : sumber jauh
        1: (12.0, 30.0),   # Hujan   : mulai mendekat
        2: (6.0,  15.0),   # Siaga   : sudah cukup dekat
        3: (3.0,   8.0),   # Kritis  : sangat dekat
        4: (0.5,   4.0),   # Bahaya  : persis di dekat sensor
    }
    r_min, r_max = jarak_rentang[phase]
    r     = random.uniform(r_min, r_max)
    angle = random.uniform(0, 2 * math.pi)
    x = CENTER[0] + r * math.cos(angle)
    y = CENTER[1] + r * math.sin(angle)
    return round(x, 4), round(y, 4)


# ==========================================
# GENERATOR UTAMA
# ==========================================

def generate_dummy_data():
    data  = []
    start = datetime.now() - timedelta(days=5)
    total_events = 5 * 24 * 60   # 1 event per menit × 5 hari = 7.200 event

    print(f"Mulai membuat data dummy ({total_events} event × 3 geophone)...")

    for i in range(total_events):
        current_time = start + timedelta(minutes=i)
        base_ts      = current_time.timestamp()

        # -----------------------------------------------
        # SKENARIO FISIK 5 HARI MENUJU LONGSOR
        # -----------------------------------------------
        if i < 2880:            # Hari 1–2 : Normal
            phase             = 0
            kelembapan_base   = random.uniform(40.0, 55.0)
            getaran_sumber    = random.uniform(0.10, 0.50)
        elif i < 4320:          # Hari 3   : Hujan mulai turun
            phase             = 1
            kelembapan_base   = random.uniform(55.0, 75.0)
            getaran_sumber    = random.uniform(0.50, 1.80)
        elif i < 5760:          # Hari 4   : Pergerakan mikro (SIAGA)
            phase             = 2
            kelembapan_base   = random.uniform(75.0, 85.0)
            getaran_sumber    = random.uniform(1.80, 3.50)
        elif i < 7150:          # Hari 5a  : Kondisi Kritis
            phase             = 3
            kelembapan_base   = random.uniform(85.0, 92.0)
            getaran_sumber    = random.uniform(3.00, 4.80)
        else:                   # Hari 5b  : BAHAYA / LONGSOR (50 menit terakhir)
            phase             = 4
            kelembapan_base   = random.uniform(90.0, 98.0)
            getaran_sumber    = random.uniform(5.50, 12.0)

        # Posisi sumber getaran untuk event ini
        src_x, src_y = _random_source_position(phase)

        # Status berdasarkan getaran sumber + kelembapan
        status_event = classify_status(getaran_sumber, kelembapan_base)

        # Batch ID — mengikat 3 baris geophone menjadi 1 event
        batch_id = uuid.uuid4().hex[:10]

        # -----------------------------------------------
        # BUAT 1 BARIS PER GEOPHONE
        # -----------------------------------------------
        for node_id, node_pos in GEOPHONE_POSITIONS.items():
            d             = _distance((src_x, src_y), node_pos)
            arrival_offset = d / WAVE_VELOCITY
            rtc_noise     = random.uniform(-RTC_NOISE_SEC, RTC_NOISE_SEC)
            arrival_ts    = base_ts + arrival_offset + rtc_noise

            # Amplitudo di node ini (lebih lemah kalau jauh)
            mms_node = _amplitude_at_node(getaran_sumber, (src_x, src_y), node_pos)
            mms_node = max(0.01, mms_node + random.uniform(-0.05, 0.05))

            # Kelembapan sedikit berbeda per node (variasi lokal)
            kelembapan = kelembapan_base + random.uniform(-1.5, 1.5)
            kelembapan = round(min(max(kelembapan, 0.0), 100.0), 2)

            # Simulasi nilai ADC raw dari geophone
            raw_adc = int((mms_node / 28.8) * 100 * ((2 ** 23 - 1) / 3.3))

            # Kekuatan sinyal (LoRa/WiFi)
            rssi = random.randint(-85, -45)

            data.append([
                node_id,
                round(arrival_ts, 6),                               # Timestamp presisi µs
                current_time.strftime("%Y-%m-%d %H:%M:%S"),
                raw_adc,
                round(mms_node, 4),
                kelembapan,
                rssi,
                status_event,
                src_x,
                src_y,
                batch_id,
            ])

    # -----------------------------------------------
    # TULIS KE CSV
    # -----------------------------------------------
    with open(FILENAME, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            "node_id",
            "arrival_timestamp",       # Unix float (detik, presisi ms dari RTC)
            "datetime_readable",
            "raw_adc",
            "nilai_mm_s",              # Amplitudo getaran di node ini
            "kelembapan_pct",
            "rssi",
            "status",
            "src_x_sim",               # [Simulasi] posisi sumber X
            "src_y_sim",               # [Simulasi] posisi sumber Y
            "batch_id",                # ID grup untuk mengikat 3 node dalam 1 event
        ])
        writer.writerows(data)

    n_event = len(data) // 3
    print(f"Selesai! {len(data)} baris ditulis ke '{FILENAME}'")
    print(f"  -> {n_event} event x 3 geophone")
    print(f"  -> Rentang waktu: {start.strftime('%Y-%m-%d')} s/d {(start + timedelta(days=5)).strftime('%Y-%m-%d')}")


if __name__ == "__main__":
    generate_dummy_data()