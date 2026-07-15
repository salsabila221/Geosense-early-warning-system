import requests

# --- DATA TELEGRAM ANDA ---
TELEGRAM_TOKEN = "8739691017:AAHCXm36fPfNaxfraNIcuYpzj4v1kUMlRrE"
TELEGRAM_CHAT_ID = "7282166909"

def send_telegram_alert(pesan):
    print("Mencoba mengirim pesan ke Telegram...")
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID, 
        "text": pesan, 
        "parse_mode": "Markdown"
    }
    try:
        response = requests.post(url, json=payload, timeout=5)
        # Mengecek apakah server Telegram menjawab dengan status sukses (200 OK)
        if response.status_code == 200:
            print("[BERHASIL] Pesan notifikasi telah terkirim ke Telegram Anda!")
        else:
            print(f"[GAGAL] Error dari Telegram: {response.text}")
    except Exception as e:
        print(f"[ERROR] Tidak ada koneksi internet atau gagal sistem: {e}")

# --- JALANKAN PENGUJIAN ---
if __name__ == "__main__":
    pesan_dummy = "⚠️ *TESTING SISTEM* ⚠️\n\nIni adalah pesan uji coba dari sistem IoT Gateway Orange Pi.\nStatus: *BERHASIL TERHUBUNG!*"
    send_telegram_alert(pesan_dummy)