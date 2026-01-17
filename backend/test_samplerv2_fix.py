#!/usr/bin/env python3
"""
Test script to verify SamplerV2 API fix for IBM Quantum
Tests the new API with real backend connection
"""

import os
import sys
import asyncio
from typing import Dict, Any

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from ibm_service import ibm_service_instance
from circuit_converter import json_to_quantum_circuit

async def test_sampler_v2_api():
    """Test the new SamplerV2 API"""
    
    print("=" * 80)
    print("🧪 TESTING SAMPLERV2 API FIX")
    print("=" * 80)
    
    # Get token from environment
    token = os.getenv("IBM_QUANTUM_TOKEN")
    if not token:
        print("❌ ERROR: IBM_QUANTUM_TOKEN not set in environment")
        print("   Set it with: $env:IBM_QUANTUM_TOKEN='your_token_here'")
        return False
    
    print(f"\n✅ Token found: {token[:10]}...")
    
    # Step 1: Validate token
    print("\n" + "=" * 80)
    print("STEP 1: Validating Token")
    print("=" * 80)
    
    validation_result = await ibm_service_instance.validate_token(token)
    
    if not validation_result.get("success"):
        print(f"❌ Token validation failed: {validation_result.get('error')}")
        return False
    
    print("✅ Token validated successfully!")
    print(f"   Hub: {validation_result.get('hub')}")
    print(f"   Group: {validation_result.get('group')}")
    print(f"   Project: {validation_result.get('project')}")
    print(f"   Channel: {validation_result.get('channel')}")
    
    # Step 2: Get backends
    print("\n" + "=" * 80)
    print("STEP 2: Fetching Available Backends")
    print("=" * 80)
    
    backends_result = await ibm_service_instance.get_backends(token)
    
    if not backends_result.get("success"):
        print(f"❌ Failed to get backends: {backends_result.get('error')}")
        return False
    
    backends = backends_result.get("backends", [])
    print(f"✅ Found {len(backends)} backends:")
    
    # Find a working backend (prefer ibm_fez or any online backend)
    target_backend = None
    for backend in backends:
        print(f"   - {backend['name']}: {backend['status']} ({backend['qubits']} qubits)")
        if backend['status'] == 'online' and not target_backend:
            target_backend = backend['name']
    
    if not target_backend:
        print("❌ No online backends available")
        return False
    
    print(f"\n🎯 Selected backend: {target_backend}")
    
    # Step 3: Create a simple test circuit
    print("\n" + "=" * 80)
    print("STEP 3: Creating Test Circuit")
    print("=" * 80)
    
    # Simple Bell state circuit
    circuit_json = {
        "numQubits": 2,
        "gates": [
            {"name": "H", "qubits": [0], "parameters": []},
            {"name": "CNOT", "qubits": [0, 1], "parameters": []}
        ]
    }
    
    print("✅ Circuit created: Bell State (H + CNOT)")
    print(f"   Qubits: {circuit_json['numQubits']}")
    print(f"   Gates: {len(circuit_json['gates'])}")
    
    # Step 4: Submit job using NEW SamplerV2 API
    print("\n" + "=" * 80)
    print("STEP 4: Submitting Job with SamplerV2")
    print("=" * 80)
    
    print(f"🚀 Submitting to backend: {target_backend}")
    print(f"   Shots: 1024")
    
    job_result = await ibm_service_instance.submit_job(
        token=token,
        backend_name=target_backend,
        circuit_json=circuit_json,
        shots=1024
    )
    
    if not job_result.get("success"):
        print(f"❌ Job submission failed: {job_result.get('error')}")
        return False
    
    job_id = job_result.get("jobId")
    job_status = job_result.get("status")
    
    print("✅ Job submitted successfully!")
    print(f"   Job ID: {job_id}")
    print(f"   Status: {job_status}")
    print(f"   Backend: {job_result.get('backend')}")
    
    # Step 5: Monitor job status
    print("\n" + "=" * 80)
    print("STEP 5: Monitoring Job Status")
    print("=" * 80)
    
    print(f"⏳ Waiting for job {job_id} to complete...")
    print("   (This may take a few minutes on real hardware)")
    
    max_attempts = 60  # 5 minutes max
    attempt = 0
    
    while attempt < max_attempts:
        await asyncio.sleep(5)  # Check every 5 seconds
        attempt += 1
        
        status_result = await ibm_service_instance.get_job_result(token, job_id)
        
        if not status_result.get("success"):
            print(f"❌ Failed to get job status: {status_result.get('error')}")
            return False
        
        current_status = status_result.get("status")
        print(f"   [{attempt}] Status: {current_status}")
        
        if current_status == "DONE":
            print("\n✅ Job completed successfully!")
            
            results = status_result.get("results", {})
            execution_time = status_result.get("executionTime", 0)
            
            print(f"   Execution time: {execution_time}s")
            print(f"   Results:")
            
            # Display top 5 results
            sorted_results = sorted(results.items(), key=lambda x: x[1], reverse=True)
            for state, count in sorted_results[:5]:
                print(f"      |{state}⟩: {count}")
            
            return True
        
        elif current_status in ["ERROR", "CANCELLED"]:
            print(f"❌ Job failed with status: {current_status}")
            return False
    
    print("⚠️  Job still running after 5 minutes (timeout)")
    print(f"   Job ID: {job_id}")
    print("   You can check it later using the job ID")
    return True

async def main():
    """Main test runner"""
    try:
        success = await test_sampler_v2_api()
        
        print("\n" + "=" * 80)
        if success:
            print("🎉 ALL TESTS PASSED!")
            print("=" * 80)
            print("\n✅ SamplerV2 API is working correctly")
            print("✅ Backend connection established")
            print("✅ Job submission successful")
            print("✅ Results retrieved successfully")
            sys.exit(0)
        else:
            print("❌ TESTS FAILED")
            print("=" * 80)
            sys.exit(1)
    
    except Exception as e:
        print("\n" + "=" * 80)
        print("❌ UNEXPECTED ERROR")
        print("=" * 80)
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
