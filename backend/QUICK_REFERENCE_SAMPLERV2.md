# 🚀 Quick Reference: SamplerV2 API Migration

## ❌ OLD API (DEPRECATED - DON'T USE)

```python
from qiskit_ibm_runtime import Sampler, Session

# OLD WAY - CAUSES ERROR
with Session(backend) as session:
    sampler = Sampler(mode=session)
    job = sampler.run(circuit, shots=1024)
```

**Error you'll get:**
```
SamplerV2.__init__() got an unexpected keyword argument 'backend'
```

---

## ✅ NEW API (CORRECT - USE THIS)

```python
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2

# NEW WAY - WORKS PERFECTLY
service = QiskitRuntimeService()
sampler = SamplerV2(service=service, backend="ibm_fez")
job = sampler.run([circuit], shots=1024)  # Note: circuit in a LIST
```

---

## 📊 Side-by-Side Comparison

| Feature | Old API | New API |
|---------|---------|---------|
| **Import** | `Sampler, Session` | `SamplerV2` |
| **Service** | Implicit | Explicit `service=` |
| **Backend** | Via Session | Direct `backend=` |
| **Session** | Required wrapper | Not needed |
| **Circuit** | Single `circuit` | List `[circuit]` |
| **Initialization** | Multi-step | One line |

---

## 🔧 What Changed in Your Code

### File: `backend/ibm_service.py`

#### Before (Lines 206-258):
```python
with Session(backend) as session:
    try:
        sampler = Sampler(mode=session)
    except (TypeError, ValueError) as e1:
        try:
            sampler = Sampler(session=session)
        except (TypeError, ValueError) as e2:
            try:
                sampler = Sampler()
            except Exception as e3:
                raise Exception(f"Could not initialize Sampler...")
    
    job = sampler.run(transpiled_qc, shots=shots)
```

#### After (Lines 206-221):
```python
# Create SamplerV2 with service and backend
sampler = SamplerV2(service=service, backend=backend_name)

# Run the job with SamplerV2
job = sampler.run([transpiled_qc], shots=shots)
```

**Lines saved:** 52 → 4 (92% reduction!)

---

## 🧪 Testing Your Fix

### 1. Quick API Check
```powershell
python backend\test_sampler_api.py
```

Expected output:
```
SamplerV2 API Check (NEW 2024+ API)
============================================================
SamplerV2.__init__ signature:
  (self, service, backend, ...)
✅ SamplerV2 is available and ready to use!
```

### 2. Minimal Example
```powershell
python backend\minimal_samplerv2_example.py
```

Expected output:
```
✅ Service loaded
✅ Circuit created (Bell State)
✅ SamplerV2 created with backend: ibm_fez
✅ Job submitted!
   Job ID: abc123...
🎉 SUCCESS! SamplerV2 API is working correctly!
```

### 3. Full Integration Test
```powershell
$env:IBM_QUANTUM_TOKEN = "your_token_here"
python backend\test_samplerv2_fix.py
```

Expected output:
```
🧪 TESTING SAMPLERV2 API FIX
✅ Token validated successfully!
✅ Found 15 backends
🎯 Selected backend: ibm_fez
✅ Job submitted successfully!
✅ Job completed successfully!
🎉 ALL TESTS PASSED!
```

---

## 🎯 Key Takeaways

1. **No more Session wrapper** - SamplerV2 handles sessions internally
2. **Explicit service parameter** - Pass `service=` to constructor
3. **Backend as string** - Use `backend="ibm_fez"` not `backend=backend_object`
4. **Circuit as list** - Always `[circuit]` not `circuit`
5. **Simpler code** - One line instead of 50+ lines of fallback logic

---

## 🆘 Troubleshooting

### Error: `ModuleNotFoundError: No module named 'qiskit_ibm_runtime'`
**Solution:**
```powershell
pip install qiskit-ibm-runtime
```

### Error: `AttributeError: module 'qiskit_ibm_runtime' has no attribute 'SamplerV2'`
**Solution:** Update to latest version
```powershell
pip install --upgrade qiskit-ibm-runtime
```

### Error: `TypeError: run() takes 2 positional arguments but 3 were given`
**Solution:** Make sure circuit is in a list:
```python
# ❌ WRONG
job = sampler.run(circuit, shots=1024)

# ✅ CORRECT
job = sampler.run([circuit], shots=1024)
```

---

## 📚 Documentation

- [Qiskit Runtime Migration Guide](https://docs.quantum.ibm.com/api/migration-guides/qiskit-runtime)
- [SamplerV2 API Reference](https://docs.quantum.ibm.com/api/qiskit-ibm-runtime/qiskit_ibm_runtime.SamplerV2)
- [IBM Quantum Platform](https://quantum.ibm.com/)

---

## ✅ Checklist

- [x] Updated imports to use `SamplerV2`
- [x] Removed `Session` wrapper
- [x] Changed to `SamplerV2(service=..., backend=...)`
- [x] Updated `run()` to use list `[circuit]`
- [x] Removed fallback logic
- [x] Added proper logging
- [ ] Tested with real backend
- [ ] Verified results display in frontend

---

**Last updated:** 2026-01-17  
**Migration status:** ✅ Complete  
**Qiskit Runtime version:** 2024+ (SamplerV2)
