"""
Test script for IBM Quantum connection
Run this to test your IBM Quantum setup
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()
from ibm_service import ibm_service_instance

async def test_connection():
    """Test IBM Quantum connection"""
    with open("connection_test_result.txt", "w") as f:
        def log(msg):
            print(msg)
            f.write(msg + "\n")
            f.flush()
            
        log("=" * 60)
        log("IBM Quantum Connection Test")
        log("=" * 60)
    
        # Get token from environment or user
        import os
        token = os.getenv("IBM_QUANTUM_TOKEN")
        
        if not token:
            token = input("\nEnter your IBM Quantum token: ").strip()
        else:
            log(f"Found token in environment variable.")

        if not token:
            log("ERROR: No token provided!")
            return False
        
        if len(token) < 10:
            log("ERROR: Token seems too short!")
            return False
        
        log(f"\nTesting token: {token[:10]}...")
        log("-" * 60)
        
        # Test 1: Validate token
        log("\n[1/3] Validating token...")
        result = await ibm_service_instance.validate_token(token)
        
        if result.get("success"):
            log("SUCCESS: Token validated successfully!")
            log(f"   Hub: {result.get('hub', 'unknown')}")
            log(f"   Channel: {result.get('channel', 'unknown')}")
        else:
            log(f"ERROR: Token validation failed: {result.get('error')}")
            return False
        
        # Test 2: Get backends
        log("\n[2/3] Fetching backends...")
        backends_result = await ibm_service_instance.get_backends(token)
        
        if backends_result.get("success"):
            backends = backends_result.get("backends", [])
            log(f"SUCCESS: Found {len(backends)} backends:")
            for backend in backends[:5]:  # Show first 5
                log(f"   - {backend['name']} ({backend['qubits']} qubits, {backend['status']}, {backend['type']})")
            if len(backends) > 5:
                log(f"   ... and {len(backends) - 5} more")
        else:
            log(f"ERROR: Failed to get backends: {backends_result.get('error')}")
            return False
        
        # Test 3: Submit a simple test job
        log("\n[3/3] Submitting test job...")
        test_circuit = {
            "numQubits": 1,
            "gates": [{"name": "H", "qubits": [0], "parameters": []}]
        }
        
        # Use first available simulator
        simulator_backends = [b for b in backends if b.get("type") == "simulator" and b.get("status") == "online"]
        if not simulator_backends:
            log("WARN: No online simulators available, skipping job test")
            return True
        
        test_backend = simulator_backends[0]["id"]
        log(f"   Using backend: {test_backend}")
        
        job_result = await ibm_service_instance.submit_job(token, test_backend, test_circuit, shots=100)
        
        if job_result.get("success"):
            job_id = job_result.get("jobId")
            log(f"SUCCESS: Job submitted successfully!")
            log(f"   Job ID: {job_id}")
            log(f"   Status: {job_result.get('status')}")
            
            # Poll for results
            log("\n   Polling for results (this may take a few seconds)...")
            max_polls = 20
            for i in range(max_polls):
                await asyncio.sleep(2)
                result = await ibm_service_instance.get_job_result(token, job_id)
                
                if result.get("success"):
                    status = result.get("status")
                    log(f"   Poll {i+1}: {status}")
                    
                    if status == "DONE":
                        results = result.get("results", {})
                        log(f"\nSUCCESS: Job completed!")
                        log(f"   Results: {results}")
                        log(f"   Execution time: {result.get('executionTime', 0):.2f}s")
                        return True
                    elif status in ["ERROR", "CANCELLED"]:
                        log(f"ERROR: Job {status.lower()}")
                        return False
        else:
            log(f"ERROR: Job submission failed: {job_result.get('error')}")
            return False
        
        log("\nWARN: Job did not complete in time")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_connection())
    with open("connection_test_result.txt", "a") as f:
        f.write("\n" + "=" * 60 + "\n")
        if success:
            f.write("SUCCESS: All tests passed! Your IBM Quantum setup is working.\n")
            print("SUCCESS: All tests passed! Your IBM Quantum setup is working.")
        else:
            f.write("ERROR: Some tests failed. Check the errors above.\n")
            print("ERROR: Some tests failed. Check the errors above.")
        f.write("=" * 60 + "\n")
        print("=" * 60)
    sys.exit(0 if success else 1)
