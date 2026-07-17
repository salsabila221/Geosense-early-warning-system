from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Import dari file buatan kita sendiri (Modular!)
import models
from database import engine, get_db

# Perintah untuk otomatis membuat file database & tabel jika belum ada
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_CLIENT_ID = "154325619553-16skq2jomkno70n87nnkpptkgipakq9f.apps.googleusercontent.com"

class GoogleAuthRequest(BaseModel):
    token: str

@app.post("/api/auth/google")
async def auth_google(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        # 1. Validasi token Google
        id_info = id_token.verify_oauth2_token(
            data.token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        email_user = id_info.get("email")
        nama_user = id_info.get("name")
        
        # 2. Cari user di database pakai SQLAlchemy ORM
        user_in_db = db.query(models.User).filter(models.User.email == email_user).first()
        
        # ================================================================
        # 📌 MAPPING 3 ADMIN BEDA DENGAN TELEGRAM MASING-MASING
        # Silakan ganti email & username telegram temanmu di bawah ini ya!
        # ================================================================
        ADMIN_MAPS = {
            "salsabilawiryawan7@gmail.com": "@chocomunn",  # Admin 1 (Kamu)
            "s4yed.sult4n@gmail.com": "@username_tele_1",  # Admin 2 (Teman 1)
            "reyhanfachrurozzi7@gmail.com": "@ryhnfch"   # Admin 3 (Teman 2)
        }
        # ================================================================
        
        # 3. Jalur Otomatis Admin: Jika belum ada di DB dan emailnya terdaftar di ADMIN_MAPS
        if not user_in_db and email_user in ADMIN_MAPS:
            # Mengambil username telegram yang berpasangan pas dengan email loginnya
            telegram_handle = ADMIN_MAPS[email_user]
            
            user_in_db = models.User(
                email=email_user,
                fullname=nama_user,       # Otomatis ditarik dari nama Google mereka
                telegram=telegram_handle, # Unik sesuai pemilik email di atas
                role="admin"
            )
            db.add(user_in_db)
            db.commit()
            db.refresh(user_in_db)
        
        # 4. Ambil keputusan untuk React frontend
        if user_in_db:
            return {
                "is_new_user": False,
                "is_admin": True if user_in_db.role == "admin" else False,
                "email": user_in_db.email,
                "name": user_in_db.fullname
            }
        else:
            # Jika orang lain login (bukan admin), dilempar ke form pendaftaran user biasa
            return {
                "is_new_user": True,
                "is_admin": False,
                "email": email_user,
                "name": nama_user
            }
            
    except ValueError:
        return {"success": False, "error": "Token Google tidak valid!"}
    
# Model data kiriman dari form onboarding React
class UserRegisterRequest(BaseModel):
    email: str
    fullname: str
    telegram: str

@app.post("/api/auth/google/register")
async def register_google_user(data: UserRegisterRequest, db: Session = Depends(get_db)):
    # Cek sekali lagi apakah user sudah terdaftar
    user_exists = db.query(models.User).filter(models.User.email == data.email).first()
    if user_exists:
        return {"success": False, "message": "User sudah terdaftar!"}
    
    # Simpan warga baru + Telegramnya ke SQLite
    new_user = models.User(
        email=data.email,
        fullname=data.fullname,
        telegram=data.telegram,
        role="user" # Otomatis jadi user biasa
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"success": True, "message": "Warga baru berhasil disimpan ke database!"}