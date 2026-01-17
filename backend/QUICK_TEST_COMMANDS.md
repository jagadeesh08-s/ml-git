# 🚀 Quick Test Commands - SamplerV2 Migration

## Prerequisites
```powershell
# Install/update Qiskit Runtime
pip install --upgrade qiskit-ibm-runtime

# Verify version (should be >= 0.20.0)
pip show qiskit-ibm-runtime
```

## Set Your IBM Quantum Token
```powershell
# Option 1: Environment variable (temporary - this session only)
$env:IBM_QUANTUM_TOKEN = "your_token_here"

# Option 2: Save permanently (recommended)
# Run this Python code once:
python -c "from qiskit_ibm_runtime import QiskitRuntimeService; QiskitRuntimeService.save_account(channel='ibm_quantum', token='your_token_here')"
```

## Test 1: API Signature Check (Quick - 2 seconds)
```powershell
cd backend
python test_sampler_api.py
```

**Expected Output:**
```
============================================================
SamplerV2 API Check (NEW 2024+ API)
============================================================
SamplerV2.__init__ signature:
  (self, service, backend, ...)
✅ SamplerV2 is available and ready to use!
```

## Test 2: Minimal Example (Medium - 30 seconds)
```powershell
cd backend
python minimal_samplerv2_example.py
```

**Expected Output:**
```
✅ Service loaded
✅ Circuit created (Bell State)
✅ SamplerV2 created with backend: ibm_fez
✅ Job submitted!
   Job ID: abc123...
⏳ Waiting for job to complete...
✅ Job completed!
📊 Measurement Results:
   |00⟩: 512
   |11⟩: 512
🎉 SUCCESS! SamplerV2 API is working correctly!
```

## Test 3: Full Integration Test (Long - 5 minutes)
```powershell
cd backend
$env:IBM_QUANTUM_TOKEN = "your_token_here"
python test_samplerv2_fix.py
```

**Expected Output:**
```
🧪 TESTING SAMPLERV2 API FIX
================================================================================
STEP 1: Validating Token
================================================================================
✅ Token validated successfully!
   Hub: ibm-q
   Group: open
   Project: main

================================================================================
STEP 2: Fetching Available Backends
================================================================================
✅ Found 15 backends:
   - ibm_fez: online (5 qubits)
   - ibm_kyoto: online (127 qubits)
   ...

🎯 Selected backend: ibm_fez

================================================================================
STEP 3: Creating Test Circuit
================================================================================
✅ Circuit created: Bell State (H + CNOT)
   Qubits: 2
   Gates: 2

================================================================================
STEP 4: Submitting Job with SamplerV2
================================================================================
🚀 Submitting to backend: ibm_fez
   Shots: 1024
✅ Job submitted successfully!
   Job ID: abc123...
   Status: QUEUED

================================================================================
STEP 5: Monitoring Job Status
================================================================================
⏳ Waiting for job to complete...
   [1] Status: QUEUED
   [2] Status: RUNNING
   [3] Status: DONE

✅ Job completed successfully!
   Execution time: 2.5s
   Results:
      |00⟩: 512
      |11⟩: 512

================================================================================
🎉 ALL TESTS PASSED!
================================================================================
```

## Test 4: Start Backend Server
```powershell
cd backend
python main.py
```

**Expected Output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## Test 5: Frontend Integration Test

1. **Start Backend:**
   ```powershell
   cd backend
   python main.py
   ```

2. **Start Frontend:**
   ```powershell
   cd ..
   npm run dev
   ```

3. **Test in Browser:**
   - Open http://localhost:5173
   - Click "Connect to IBM Quantum"
   - Enter your token
   - Click "Connect"
   - Should see: "✅ Connected to IBM Quantum"
   - Select backend: "ibm_fez"
   - Build a simple circuit (H + CNOT)
   - Click "Run on Hardware"
   - Should see job ID and status
   - Wait for results
   - Should see measurement outcomes

## Troubleshooting Commands

### Check if Qiskit Runtime is installed
```powershell
pip show qiskit-ibm-runtime
```

### Check Python version (should be 3.8+)
```powershell
python --version
```

### List available backends
```powershell
python -c "from qiskit_ibm_runtime import QiskitRuntimeService; service = QiskitRuntimeService(); backends = service.backends(); [print(b.name) for b in backends]"
```

### Check if token is saved
```powershell
python -c "from qiskit_ibm_runtime import QiskitRuntimeService; service = QiskitRuntimeService(); print(service.active_account())"
```

### View backend logs
```powershell
tail -f backend\backend.log
```

### Clear Python cache
```powershell
Remove-Item -Recurse -Force backend\__pycache__
```

## Quick Fixes

### Fix: ModuleNotFoundError
```powershell
pip install qiskit-ibm-runtime
```

### Fix: SamplerV2 not found
```powershell
pip install --upgrade qiskit-ibm-runtime
```

### Fix: Token not working
```powershell
# Delete saved account and re-save
python -c "from qiskit_ibm_runtime import QiskitRuntimeService; QiskitRuntimeService.delete_account(); QiskitRuntimeService.save_account(channel='ibm_quantum', token='your_new_token')"
```

### Fix: Backend not found
```powershell
# List available backends
python -c "from qiskit_ibm_runtime import QiskitRuntimeService; service = QiskitRuntimeService(); backends = service.backends(); [print(f'{b.name}: {b.status().operational}') for b in backends]"
```

## Success Indicators

✅ **Test 1 passes:** API is correctly installed
✅ **Test 2 passes:** SamplerV2 works with saved token
✅ **Test 3 passes:** Full integration works end-to-end
✅ **Backend starts:** Server is running
✅ **Frontend connects:** Integration is working

## Next Steps After All Tests Pass

1. ✅ Code is working
2. ✅ Tests pass
3. ✅ Integration works
4. 📝 Update README
5. 🚀 Deploy to production
6. 📊 Monitor logs
7. 🎉 Celebrate!

## Documentation

- 📖 Full Guide: `backend/SAMPLERV2_MIGRATION.md`
- 📋 Quick Ref: `backend/QUICK_REFERENCE_SAMPLERV2.md`
- 📄 Summary: `backend/MIGRATION_COMPLETE.md`
- 📊 ASCII: `backend/MIGRATION_SUMMARY.txt`

## Support

If tests fail, check:
1. Qiskit version >= 0.20.0
2. Token is valid and saved
3. Backend is online
4. Python version >= 3.8
5. No firewall blocking IBM Quantum API

For detailed troubleshooting, see `backend/SAMPLERV2_MIGRATION.md`
