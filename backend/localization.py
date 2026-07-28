"""
localization.py — Geosense Early Warning System
================================================
Modul lokalisasi sumber getaran menggunakan metode TDOA
(Time Difference of Arrival / Perbedaan Waktu Tiba).

Prinsip:
  Gelombang seismik dari sumber getaran akan tiba lebih cepat
  di geophone yang lebih dekat. Selisih waktu tiba antar 3 geophone
  digunakan untuk mencari posisi sumber secara numerik.

Layout fisik geophone (segitiga sama sisi, sisi = 2 meter):

          NODE_03 (1.0, 1.732)
              /\
             /  \
            /    \
  NODE_01 (0,0)--NODE_02 (2,0)

Hasil akhir disajikan dalam koordinat POLAR (r, θ) dari centroid segitiga.
"""

import math
import json
from typing import Dict, Optional, Tuple

import numpy as np
from scipy.optimize import minimize

# ==========================================
# KONFIGURASI POSISI GEOPHONE (meter)
# ==========================================
_SQRT3 = math.sqrt(3)

GEOPHONE_POSITIONS: Dict[str, np.ndarray] = {
    "NODE_01": np.array([0.0,        0.0    ]),   # Kiri bawah
    "NODE_02": np.array([2.0,        0.0    ]),   # Kanan bawah
    "NODE_03": np.array([1.0,    _SQRT3     ]),   # Puncak ≈ (1.0, 1.7321)
}

# Kecepatan gelombang seismik (m/s)
# Tanah kering: ~150–200 m/s | Tanah basah/liat: ~250–350 m/s | Batuan: ~1000+ m/s
WAVE_VELOCITY: float = 300.0   # Default: tanah lembap/basah

# Centroid segitiga sebagai pusat referensi koordinat polar
CENTER: np.ndarray = np.array([1.0, _SQRT3 / 3.0])   # ≈ (1.0, 0.5774)

# Daftar node yang wajib ada agar lokalisasi bisa dijalankan
REQUIRED_NODES = set(GEOPHONE_POSITIONS.keys())


# ==========================================
# FUNGSI INTERNAL
# ==========================================

def _tdoa_cost(source_xy: np.ndarray,
               positions: list,
               tdoa_meas: list,
               velocity: float) -> float:
    """
    Fungsi cost (sum of squared errors) antara TDOA terukur vs prediksi.
    Diminimisasi oleh optimizer untuk menemukan posisi sumber.

    Args:
        source_xy   : Kandidat posisi sumber [x, y]
        positions   : List posisi geophone (np.ndarray), node referensi di [0]
        tdoa_meas   : List TDOA (detik) relatif ke node referensi
        velocity    : Kecepatan gelombang seismik (m/s)

    Returns:
        float — total error kuadrat
    """
    src = np.array(source_xy, dtype=float)
    distances = [float(np.linalg.norm(src - pos)) for pos in positions]
    d_ref = distances[0]

    predicted_tdoa = [(d - d_ref) / velocity for d in distances[1:]]
    error = sum((pred - meas) ** 2 for pred, meas in zip(predicted_tdoa, tdoa_meas))
    return float(error)


# ==========================================
# FUNGSI UTAMA — LOKALISASI
# ==========================================

def localize_source(arrival_times: Dict[str, float],
                    velocity: float = WAVE_VELOCITY) -> dict:
    """
    Hitung posisi sumber getaran dari waktu tiba di 3 geophone.

    Menggunakan metode TDOA dengan optimasi numerik Nelder-Mead,
    dicoba dari beberapa titik awal untuk menghindari local minimum.

    Args:
        arrival_times : Dict {node_id: unix_timestamp_float (detik, presisi ms)}
                        Contoh:
                        {
                            "NODE_01": 1721000000.1230,
                            "NODE_02": 1721000000.1297,   # tiba 6.7ms lebih lambat
                            "NODE_03": 1721000000.1263
                        }
        velocity      : Kecepatan gelombang seismik (m/s). Default 300 m/s.

    Returns:
        dict — hasil lokalisasi:
        {
            "success"       : True,
            "cartesian"     : {"x": 5.3, "y": -2.1},   # meter
            "polar"         : {"r_meter": 5.7, "theta_deg": 201.5},
            "confidence"    : 0.97,                      # 0-1
            "reference_node": "NODE_01",                 # yang paling awal
            "tdoa_ms"       : {"NODE_02": 6.7, "NODE_03": 3.3},
            "wave_velocity" : 300.0
        }
        atau jika gagal:
        {
            "success": False,
            "error": "pesan error"
        }
    """
    # --- Validasi input ---
    missing = REQUIRED_NODES - set(arrival_times.keys())
    if missing:
        return {"success": False, "error": f"Data belum lengkap, node hilang: {missing}"}

    nodes     = list(GEOPHONE_POSITIONS.keys())
    positions = [GEOPHONE_POSITIONS[n] for n in nodes]
    times     = [float(arrival_times[n]) for n in nodes]

    # --- Node referensi = yang paling awal menerima getaran ---
    ref_idx = int(np.argmin(times))
    other_idx = [i for i in range(len(nodes)) if i != ref_idx]

    ordered_nodes = [nodes[ref_idx]] + [nodes[i] for i in other_idx]
    ordered_pos   = [positions[ref_idx]] + [positions[i] for i in other_idx]
    ordered_times = [times[ref_idx]]  + [times[i] for i in other_idx]

    # TDOA (detik) relatif ke node referensi
    tdoa_sec = [t - ordered_times[0] for t in ordered_times[1:]]

    # --- Optimasi dari beberapa titik awal ---
    # (Mencegah terjebak di local minimum)
    initial_guesses = [
        CENTER,
        np.array([ 0.0,  0.0]),
        np.array([ 1.0,  4.0]),
        np.array([ 1.0, -3.0]),
        np.array([-3.0,  1.0]),
        np.array([ 4.0,  1.0]),
        np.array([-2.0, -2.0]),
        np.array([ 3.0,  3.0]),
    ]

    best_result = None
    best_cost   = float('inf')

    for x0 in initial_guesses:
        res = minimize(
            _tdoa_cost,
            x0,
            args=(ordered_pos, tdoa_sec, velocity),
            method='Nelder-Mead',
            options={'xatol': 1e-9, 'fatol': 1e-16, 'maxiter': 100_000}
        )
        if res.fun < best_cost:
            best_cost   = res.fun
            best_result = res

    x_s, y_s = float(best_result.x[0]), float(best_result.x[1])

    # --- Konversi ke Koordinat Polar dari Centroid Segitiga ---
    r, theta = to_polar(x_s, y_s)

    # --- Confidence score (0–1) ---
    # Semakin kecil residual error → semakin tinggi confidence
    confidence = round(1.0 / (1.0 + best_cost * 1e8), 4)
    confidence = float(max(0.0, min(1.0, confidence)))

    # TDOA dalam milidetik (lebih mudah dibaca manusia)
    tdoa_ms = {
        ordered_nodes[i + 1]: round(tdoa_sec[i] * 1000, 4)
        for i in range(len(tdoa_sec))
    }

    return {
        "success"        : True,
        "cartesian"      : {"x": round(x_s, 4), "y": round(y_s, 4)},
        "polar"          : {"r_meter": round(r, 4), "theta_deg": round(theta, 2)},
        "confidence"     : confidence,
        "reference_node" : ordered_nodes[0],
        "tdoa_ms"        : tdoa_ms,
        "wave_velocity"  : velocity,
    }


# ==========================================
# FUNGSI UTILITAS
# ==========================================

def to_polar(x: float, y: float,
             cx: Optional[float] = None,
             cy: Optional[float] = None) -> Tuple[float, float]:
    """
    Konversi koordinat Kartesian (x, y) ke Polar (r, θ°).
    Referensi default = centroid segitiga geophone.

    Args:
        x, y     : Koordinat titik sumber (meter)
        cx, cy   : Koordinat pusat referensi (default: centroid segitiga)

    Returns:
        (r, theta_deg)
          r         — jarak dari pusat (meter)
          theta_deg — sudut 0°–360° searah jarum jam dari utara (North-up)
                      (0° = atas/utara, 90° = kanan/timur, dst.)
    """
    cx = float(CENTER[0]) if cx is None else float(cx)
    cy = float(CENTER[1]) if cy is None else float(cy)

    dx, dy = x - cx, y - cy
    r     = math.sqrt(dx ** 2 + dy ** 2)

    # atan2 standar: 0° = timur, berlawanan jarum jam
    # Konversi ke bearing: 0° = utara, searah jarum jam
    theta_math = math.degrees(math.atan2(dy, dx))
    theta_bearing = (90.0 - theta_math) % 360.0

    return round(r, 6), round(theta_bearing, 4)


def from_polar(r: float, theta_deg: float,
               cx: Optional[float] = None,
               cy: Optional[float] = None) -> Tuple[float, float]:
    """
    Konversi koordinat Polar (r, θ°) kembali ke Kartesian (x, y).
    Kebalikan dari to_polar().

    Args:
        r         : Jarak dari pusat (meter)
        theta_deg : Sudut bearing 0°–360° (0° = utara)
        cx, cy    : Koordinat pusat referensi

    Returns:
        (x, y) dalam meter
    """
    cx = float(CENTER[0]) if cx is None else float(cx)
    cy = float(CENTER[1]) if cy is None else float(cy)

    # Balik konversi bearing ke sudut math
    theta_math = math.radians(90.0 - theta_deg)
    x = cx + r * math.cos(theta_math)
    y = cy + r * math.sin(theta_math)
    return round(x, 6), round(y, 6)


def get_geophone_info() -> dict:
    """
    Kembalikan informasi konfigurasi array geophone.
    Berguna untuk endpoint API /api/geophone/config.
    """
    return {
        "nodes": {
            node_id: {"x": float(pos[0]), "y": float(pos[1])}
            for node_id, pos in GEOPHONE_POSITIONS.items()
        },
        "center": {"x": float(CENTER[0]), "y": float(CENTER[1])},
        "side_length_m": 2.0,
        "triangle_type": "equilateral",
        "wave_velocity_ms": WAVE_VELOCITY,
        "max_tdoa_ms": round((2.0 / WAVE_VELOCITY) * 1000, 3),   # ≈ 6.67 ms
    }


# ==========================================
# SELF-TEST (jalankan: python localization.py)
# ==========================================
if __name__ == "__main__":
    print("=" * 55)
    print("  Self-test Lokalisasi TDOA — Geosense EWS")
    print("=" * 55)

    # Test case: sumber di posisi yang diketahui
    test_cases = [
        ("Depan (utara)",   5.0,  _SQRT3 / 3.0 + 5.0),
        ("Kanan (timur)",   6.0,  _SQRT3 / 3.0      ),
        ("Kiri (barat)",   -4.0,  _SQRT3 / 3.0      ),
        ("Belakang (sel)", 1.0,  _SQRT3 / 3.0 - 4.0),
        ("Dekat node 1",   0.3,  0.3                 ),
    ]

    for label, src_x, src_y in test_cases:
        # Hitung waktu tiba teoritis
        base_t = 1_700_000_000.0
        arrival = {}
        for node_id, pos in GEOPHONE_POSITIONS.items():
            d = math.sqrt((src_x - pos[0])**2 + (src_y - pos[1])**2)
            arrival[node_id] = base_t + d / WAVE_VELOCITY

        result = localize_source(arrival)
        est_x = result["cartesian"]["x"]
        est_y = result["cartesian"]["y"]
        err   = math.sqrt((est_x - src_x)**2 + (est_y - src_y)**2)

        print(f"\n[{label}]")
        print(f"  Sumber asli  : ({src_x:.3f}, {src_y:.3f})")
        print(f"  Estimasi     : ({est_x:.3f}, {est_y:.3f})")
        print(f"  Polar        : r={result['polar']['r_meter']} m | theta={result['polar']['theta_deg']} deg")
        print(f"  Error        : {err*100:.2f} cm | Confidence: {result['confidence']}")
        print(f"  TDOA (ms)    : {result['tdoa_ms']}")
