#!/usr/bin/env python3
"""
🔥 MINIMAL WORKING EXAMPLE - SamplerV2 API
This is the simplest possible example of using the NEW Qiskit Runtime API
"""

from qiskit import QuantumCircuit
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2

# ============================================================================
# STEP 1: Load service (token already saved)
# ============================================================================
# If you haven't saved your token yet, run this once:
# QiskitRuntimeService.save_account(channel="ibm_quantum", token="YOUR_TOKEN_HERE")

service = QiskitRuntimeService()
print("✅ Service loaded")

# ============================================================================
# STEP 2: Create a simple quantum circuit
# ============================================================================
qc = QuantumCircuit(2)
qc.h(0)           # Hadamard on qubit 0
qc.cx(0, 1)       # CNOT from qubit 0 to qubit 1
qc.measure_all()  # Measure all qubits

print("✅ Circuit created (Bell State)")
print(qc)

# ============================================================================
# STEP 3: Create SamplerV2 with service and backend
# ============================================================================
# ✅ CORRECT WAY (NEW API):
sampler = SamplerV2(service=service, backend="ibm_fez")

print("✅ SamplerV2 created with backend: ibm_fez")

# ============================================================================
# STEP 4: Run the job
# ============================================================================
# Note: Circuit must be passed as a LIST
job = sampler.run([qc], shots=1024)

print(f"✅ Job submitted!")
print(f"   Job ID: {job.job_id()}")
print(f"   Status: {job.status()}")

# ============================================================================
# STEP 5: Get results (this will wait for job to complete)
# ============================================================================
print("\n⏳ Waiting for job to complete...")
result = job.result()

print("\n✅ Job completed!")
print(f"   Result: {result}")

# ============================================================================
# STEP 6: Display the measurement results
# ============================================================================
# SamplerV2 returns PrimitiveResult with quasi-probability distributions
pub_result = result[0]  # Get first (and only) pub result
counts = pub_result.data.meas.get_counts()

print("\n📊 Measurement Results:")
for state, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
    print(f"   |{state}⟩: {count}")

print("\n🎉 SUCCESS! SamplerV2 API is working correctly!")

# ============================================================================
# 🧠 KEY POINTS TO REMEMBER:
# ============================================================================
# 1. Use SamplerV2, not Sampler
# 2. Pass service= and backend= to constructor
# 3. No Session wrapper needed
# 4. Pass circuits as a LIST: [qc]
# 5. Results are in result[0].data.meas.get_counts()
# ============================================================================
