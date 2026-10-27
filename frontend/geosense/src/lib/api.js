// Helper kecil untuk semua request ke backend FastAPI.
// Ganti base URL lewat .env: VITE_API_URL=https://xxx.hf.space
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "")
export const IS_NGROK = /ngrok/i.test(API_URL)

const TOKEN_KEY = "geosense_token"

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* localStorage bisa diblokir di private mode */
  }
}

export function clearToken() {
  setToken(null)
}

export async function apiFetch(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const finalHeaders = { ...headers }
  const token = getToken()

  if (body !== undefined) finalHeaders["Content-Type"] = "application/json"
  if (auth && token) finalHeaders.Authorization = `Bearer ${token}`
  // Free-tier ngrok menampilkan halaman peringatan di browser. Header ini
  // membuat request API langsung diteruskan ke FastAPI.
  if (IS_NGROK && !finalHeaders["ngrok-skip-browser-warning"]) {
    finalHeaders["ngrok-skip-browser-warning"] = "true"
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  return { ok: response.ok, status: response.status, data }
}
