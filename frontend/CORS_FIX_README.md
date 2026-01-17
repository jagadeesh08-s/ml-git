# 🌐 CORS & Network Configuration Update

## ✅ The Fix for "Access to fetch has been blocked by CORS policy"

We encountered an issue where the frontend (running on `192.168.56.1`) could not connect to the backend (running on `localhost`) due to:
1.  **CORS Policy:** The backend was restricting origins.
2.  **Network Reachability:** Javascript on a remote device (e.g., mobile on WiFi) trying to hit `localhost` refers to itself, not the server.

### 🔧 Changes Applied

#### 1. Backend (`backend/main.py`)
Updated CORS configuration to allow **ANY** origin via Regex, while still supporting credentials (cookies/headers).

```python
# BEFORE
allow_origins=["*"],  # Invalid with allow_credentials=True

# AFTER
allow_origin_regex="https?://.*",  # Valid! Allows http://ANYTHING and https://ANYTHING
allow_credentials=True,
```

#### 2. Frontend (`.env`)
Updated API URL to use your machine's **LAN IP** instead of `localhost`.

```properties
# BEFORE
VITE_API_BASE_URL=http://localhost:3005

# AFTER
VITE_API_BASE_URL=http://192.168.56.1:3005
```

### 🚀 How to Apply

1.  **Restart Frontend:**
    You MUST restart `npm run dev` for `.env` changes to take effect.
    ```powershell
    Ctrl+C
    npm run dev
    ```

2.  **Verify Backend:**
    Ensure `python -m uvicorn main:app ...` is still running. It should have auto-reloaded.

3.  **Test:**
    Open `http://192.168.56.1:8080` in your browser.
    Connect to IBM Quantum.
    It should validly fetch from `http://192.168.56.1:3005`.

### ❓ FAQ

**Q: I thought I was using Node.js?**
A: Your project is using **Python (FastAPI)** for the backend. The fix above applies to your running Python server.

**Q: Why change localhost to IP?**
A: `localhost` only works if the browser and server are on the same machine. Using the IP allows you to test from other devices (phones, laptops) on the same network.
