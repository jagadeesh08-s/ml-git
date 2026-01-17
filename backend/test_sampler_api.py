"""
Quick test to check SamplerV2 API signature (NEW 2024+ API)
"""
try:
    from qiskit_ibm_runtime import SamplerV2, QiskitRuntimeService
    import inspect
    
    print("=" * 60)
    print("SamplerV2 API Check (NEW 2024+ API)")
    print("=" * 60)
    
    # Check SamplerV2 __init__ signature
    sampler_sig = inspect.signature(SamplerV2.__init__)
    print(f"\nSamplerV2.__init__ signature:")
    print(f"  {sampler_sig}")
    
    # Check QiskitRuntimeService __init__ signature
    service_sig = inspect.signature(QiskitRuntimeService.__init__)
    print(f"\nQiskitRuntimeService.__init__ signature:")
    print(f"  {service_sig}")
    
    print("\n" + "=" * 60)
    print("✅ CORRECT USAGE (NEW API):")
    print("=" * 60)
    print("  service = QiskitRuntimeService()")
    print("  sampler = SamplerV2(service=service, backend='ibm_fez')")
    print("  job = sampler.run([circuit], shots=1024)")
    print("=" * 60)
    
    print("\n" + "=" * 60)
    print("❌ WRONG USAGE (OLD API - DEPRECATED):")
    print("=" * 60)
    print("  # DON'T DO THIS:")
    print("  sampler = Sampler(backend=backend)  # ❌ WRONG")
    print("  sampler = SamplerV2(backend=backend)  # ❌ WRONG")
    print("  with Session(backend) as session:  # ❌ OLD API")
    print("      sampler = Sampler(mode=session)  # ❌ OLD API")
    print("=" * 60)
    
    print("\n✅ SamplerV2 is available and ready to use!")
    
except ImportError as e:
    print(f"❌ Error: {e}")
    print("Install qiskit-ibm-runtime: pip install qiskit-ibm-runtime")
    print("Make sure you have version >= 0.20.0")
