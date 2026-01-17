# IBM Quantum Integration - Setup & Testing Guide

## 🔧 Fixed Issues

✅ **Authentication** - Proper token validation with channel detection  
✅ **Connection** - Enhanced error handling and logging  
✅ **Console Output** - Detailed logging at every step  
✅ **Backend Selection** - Automatic best backend selection  
✅ **Runtime Service** - Proper QiskitRuntimeService initialization  
✅ **Job Results** - Fixed result formatting and display  
✅ **Error Messages** - Clear, actionable error messages  

## 📋 How to Get Your IBM Quantum Token

### Option 1: IBM Quantum Platform (Free)
1. Go to https://quantum.ibm.com/
2. Sign up/Login
3. Go to **Account Settings** → **API Token**
4. Copy your token (starts with alphanumeric characters)

### Option 2: IBM Cloud (Paid)
1. Go to https://cloud.ibm.com/
2. Create IBM Quantum service instance
3. Get IAM API key and Instance CRN
4. Use the IAM token (longer, base64-like)

## 🧪 Testing Your Connection

### Method 1: Using the Test Script

```bash
cd backend
python test_ibm_connection.py
```

This will:
1. ✅ Validate your token
2. ✅ List available backends
3. ✅ Submit a test job
4. ✅ Poll for results
5. ✅ Print job results

### Method 2: Using the Web App

1. **Start the backend:**
   ```bash
   cd backend
   python main.py
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **In the web app:**
   - Click "Connect to IBM Quantum"
   - Enter your token
   - Check browser console (F12) for detailed logs
   - Check backend console for server-side logs

## 🔍 Debugging

### Check Backend Console

You should see logs like:
```
[IBM] 🔐 Connecting with token: abc123...
[IBM] 📡 Validating token with IBM Quantum...
[IBM] ✅ Connection successful! Hub: ibm-q, Channel: ibm_quantum_platform
[IBM] 🔍 Fetching backends...
[IBM] ✅ Found 15 backends
```

### Check Browser Console (F12)

You should see logs like:
```
[IBM Quantum] 🔐 Starting authentication...
[IBM Quantum] 📡 Token: abc123...
[IBM Quantum] 🌐 Connecting to backend...
[IBM Quantum] ✅ Authentication successful!
[IBM Quantum] 🔍 Fetching available backends...
[IBM Quantum] ✅ Found 15 backends
```

### Common Issues

#### ❌ "Token validation failed"
- **Cause:** Invalid or expired token
- **Fix:** Get a new token from IBM Quantum website

#### ❌ "Could not reach backend server"
- **Cause:** Backend not running or CORS issue
- **Fix:** 
  - Ensure backend is running on port 3005
  - Check `VITE_API_BASE_URL` in frontend `.env`

#### ❌ "No backends available"
- **Cause:** Token valid but no access to backends
- **Fix:** Check your IBM Quantum account permissions

#### ❌ "Job submission failed"
- **Cause:** Backend not operational or circuit too large
- **Fix:** 
  - Try a simulator backend first
  - Reduce circuit size
  - Check backend status

## 📊 API Flow

```
Frontend (React)
    ↓
POST /api/ibm/connect { token }
    ↓
Backend validates token
    ↓
GET /api/ibm/backends?token=...
    ↓
Frontend displays backends
    ↓
POST /api/ibm/execute { token, backend, circuit, shots }
    ↓
Backend submits to IBM Quantum
    ↓
GET /api/ibm/job/{jobId}?token=... (polling)
    ↓
Backend fetches results
    ↓
Frontend displays results
```

## 🎯 Example Usage

### In Python (Backend)

```python
from ibm_service import ibm_service_instance

# Validate token
result = await ibm_service_instance.validate_token("your_token_here")
print(result)  # {"success": True, "hub": "ibm-q", ...}

# Get backends
backends = await ibm_service_instance.get_backends("your_token_here")
print(backends["backends"])

# Submit job
circuit = {
    "numQubits": 2,
    "gates": [
        {"name": "H", "qubits": [0], "parameters": []},
        {"name": "CNOT", "qubits": [0, 1], "parameters": []}
    ]
}
job = await ibm_service_instance.submit_job(
    "your_token_here",
    "ibmq_qasm_simulator",
    circuit,
    shots=1024
)
print(job)  # {"success": True, "jobId": "...", ...}

# Get results
result = await ibm_service_instance.get_job_result("your_token_here", job["jobId"])
print(result["results"])  # {"00": 0.5, "11": 0.5}
```

### In TypeScript (Frontend)

```typescript
import { connectToIBM, getIBMBackends, executeOnIBM, getIBMJobStatus } from '@/services/quantumAPI';

// Connect
const connectResult = await connectToIBM("your_token_here");
console.log(connectResult);

// Get backends
const backendsResult = await getIBMBackends("your_token_here");
console.log(backendsResult.backends);

// Execute
const circuit = {
  numQubits: 2,
  gates: [
    { name: "H", qubits: [0], parameters: [] },
    { name: "CNOT", qubits: [0, 1], parameters: [] }
  ]
};
const jobResult = await executeOnIBM("your_token_here", "ibmq_qasm_simulator", circuit, 1024);
console.log(jobResult);

// Poll for results
const statusResult = await getIBMJobStatus(jobResult.jobId, "your_token_here");
console.log(statusResult.results);
```

## 🔐 Security Notes

- **Never commit tokens to git**
- **Use environment variables:**
  ```bash
  export IBM_QUANTUM_TOKEN="your_token_here"
  ```
- **Tokens expire** - Get new ones periodically
- **Different tokens for different environments**

## 📝 Environment Variables

```bash
# Backend (.env)
IBM_QUANTUM_TOKEN=your_token_here
PORT=3005

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:3005
```

## ✅ Success Indicators

When everything works, you'll see:

1. **Backend console:**
   ```
   [IBM] ✅ Connection successful!
   [IBM] ✅ Found 15 backends
   [IBM] ✅ Job submitted successfully!
   [IBM] ✅ Job completed! Results: {...}
   ```

2. **Browser console:**
   ```
   [IBM Quantum] ✅ Authentication successful!
   [IBM Quantum] ✅ Found 15 backends
   [IBM Quantum] ✅ Job submitted successfully!
   [IBM Quantum] ✅ Job completed successfully!
   ```

3. **Web UI:**
   - Green "Connected" status
   - Backend dropdown populated
   - Job results displayed

## 🆘 Still Having Issues?

1. **Check token format:**
   - IBM Quantum Platform: ~40-50 chars, alphanumeric
   - IBM Cloud: ~200+ chars, base64-like

2. **Check network:**
   - Backend can reach `api.quantum.ibm.com`
   - No firewall blocking

3. **Check dependencies:**
   ```bash
   pip install qiskit qiskit-ibm-runtime
   ```

4. **Enable debug logging:**
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```
