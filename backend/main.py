import paho.mqtt.client as mqtt
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from pydantic import BaseModel
from sqlalchemy.orm import Session
import models
from database import engine, get_db, SessionLocal

# --- SETUP DATABASE ---
models.Base.metadata.create_all(bind=engine)

# --- FUNGSI MQTT (BACKGROUND) ---
def update_status_in_db(new_status):
    db = SessionLocal()
    status_entry = db.query(models.SystemStatus).filter(models.SystemStatus.id == 1).first()
    if not status_entry:
        status_entry = models.SystemStatus(id=1, status=new_status)
        db.add(status_entry)
    else:
        status_entry.status = new_status
    db.commit()
    db.close()

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    update_status_in_db(payload)

mqtt_client = mqtt.Client()
mqtt_client.on_message = on_message
mqtt_client.connect("broker.hivemq.com", 1883, 60)
mqtt_client.subscribe("geosense/status")
mqtt_client.loop_start()

# --- APP SETUP ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

GOOGLE_CLIENT_ID = "154325619553-16skq2jomkno70n87nnkpptkgipakq9f.apps.googleusercontent.com"

# --- ENDPOINTS ---
class GoogleAuthRequest(BaseModel):
    token: str

@app.post("/api/auth/google")
async def auth_google(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        id_info = id_token.verify_oauth2_token(data.token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email_user = id_info.get("email")
        nama_user = id_info.get("name")
        
        user_in_db = db.query(models.User).filter(models.User.email == email_user).first()
        
        ADMIN_MAPS = {
            "salsabilawiryawan7@gmail.com": "@chocomunn",
            "s4yed.sult4n@gmail.com": "@username_tele_1",
            "reyhanfachrurozzi7@gmail.com": "@ryhnfch"
        }
        
        if not user_in_db and email_user in ADMIN_MAPS:
            user_in_db = models.User(email=email_user, fullname=nama_user, telegram=ADMIN_MAPS[email_user], role="admin")
            db.add(user_in_db)
            db.commit()
            db.refresh(user_in_db)
        
        return {
            "is_new_user": user_in_db is None,
            "is_admin": user_in_db.role == "admin" if user_in_db else False,
            "email": email_user,
            "name": nama_user
        }
    except ValueError:
        return {"success": False, "error": "Invalid token"}

@app.get("/api/status")
async def get_status(db: Session = Depends(get_db)):
    status_entry = db.query(models.SystemStatus).filter(models.SystemStatus.id == 1).first()
    return {
        "status": status_entry.status if status_entry else "Normal",
        "lastUpdated": status_entry.last_updated.strftime("%Y-%m-%d %H:%M:%S") if status_entry else "N/A"
    }

class UserRegisterRequest(BaseModel):
    email: str
    fullname: str
    telegram: str

@app.post("/api/auth/google/register")
async def register_user(data: UserRegisterRequest, db: Session = Depends(get_db)):
    new_user = models.User(email=data.email, fullname=data.fullname, telegram=data.telegram, role="user")
    db.add(new_user)
    db.commit()
    return {"success": True}