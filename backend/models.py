from sqlalchemy import Column, String, Boolean, Integer, DateTime, Float
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    email    = Column(String,  primary_key=True, index=True)
    fullname = Column(String)
    telegram = Column(String,  nullable=True)   # username telegram atau nomor HP
    role     = Column(String,  default="user")  # 'user' atau 'admin'
    is_active = Column(Boolean, default=True)


class SystemStatus(Base):
    __tablename__ = "system_status"

    # Selalu ada 1 baris (id=1), di-update setiap ada perubahan status
    id           = Column(Integer,  primary_key=True, index=True, default=1)
    status       = Column(String,   default="Normal")   # Normal | Siaga | Warning
    last_updated = Column(DateTime, default=datetime.datetime.utcnow,
                          onupdate=datetime.datetime.utcnow)


class SensorReading(Base):
    """
    Histori pembacaan sensor mentah per geophone.
    Setiap kali 1 node mengirim data MQTT, 1 baris tersimpan di sini.
    """
    __tablename__ = "sensor_readings"

    id                = Column(Integer,  primary_key=True, autoincrement=True)
    batch_id          = Column(String,   index=True, nullable=True)  # Penanda grup 1 event
    node_id           = Column(String,   index=True)                 # NODE_01 / NODE_02 / NODE_03
    arrival_timestamp = Column(Float,    nullable=True)              # Unix timestamp float (presisi ms)
    nilai_mm_s        = Column(Float,    nullable=True)              # Amplitudo getaran (mm/s)
    kelembapan_pct    = Column(Float,    nullable=True)              # Kelembapan tanah (%)
    rssi              = Column(Integer,  nullable=True)              # Kekuatan sinyal WiFi/LoRa (dBm)
    status            = Column(String,   nullable=True)              # Aman | Siaga | Warning
    recorded_at       = Column(DateTime, default=datetime.datetime.utcnow)


class SeismicEvent(Base):
    """
    Hasil lokalisasi sumber getaran dari satu event seismik.
    Dibuat setiap kali ketiga geophone sudah menerima getaran yang sama
    dan algoritma TDOA berhasil menghitung posisi sumber.
    """
    __tablename__ = "seismic_events"

    id             = Column(Integer,  primary_key=True, autoincrement=True)
    batch_id       = Column(String,   index=True, unique=True)  # Penanda grup event

    # Posisi sumber dalam koordinat Kartesian (meter, relatif NODE_01)
    source_x       = Column(Float,    nullable=True)
    source_y       = Column(Float,    nullable=True)

    # Posisi sumber dalam koordinat Polar (dari centroid segitiga)
    r_meter        = Column(Float,    nullable=True)  # Jarak sumber (meter)
    theta_deg      = Column(Float,    nullable=True)  # Sudut bearing 0–360° (0°=utara)

    # Metadata lokalisasi
    confidence     = Column(Float,    nullable=True)  # 0.0–1.0
    reference_node = Column(String,   nullable=True)  # Node yang paling dulu menerima
    wave_velocity  = Column(Float,    nullable=True)  # Kecepatan gelombang yang dipakai (m/s)
    tdoa_ms        = Column(String,   nullable=True)  # JSON: selisih waktu tiba per node (ms)

    # Status bahaya hasil gabungan ketiga node
    overall_status = Column(String,   nullable=True)  # Aman | Siaga | Warning

    detected_at    = Column(DateTime, default=datetime.datetime.utcnow)