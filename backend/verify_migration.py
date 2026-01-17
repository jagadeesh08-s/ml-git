#!/usr/bin/env python3
"""
🧪 STEP-BY-STEP TESTING GUIDE
Run this to verify the SamplerV2 migration works correctly
"""

import os
import sys

def print_header(title):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")

def print_step(number, title):
    print(f"\n{'─' * 80}")
    print(f"STEP {number}: {title}")
    print('─' * 80)

def check_imports():
    """Check if all required packages are installed"""
    print_step(1, "Checking Python Packages")
    
    try:
        import qiskit_ibm_runtime
        version = qiskit_ibm_runtime.__version__ if hasattr(qiskit_ibm_runtime, '__version__') else "unknown"
        print(f"✅ qiskit-ibm-runtime: {version}")
        
        from qiskit_ibm_runtime import SamplerV2
        print("✅ SamplerV2 is available")
        
        from qiskit_ibm_runtime import QiskitRuntimeService
        print("✅ QiskitRuntimeService is available")
        
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("\n💡 Fix: Run this command:")
        print("   pip install --upgrade qiskit-ibm-runtime")
        return False

def check_token():
    """Check if IBM Quantum token is available"""
    print_step(2, "Checking IBM Quantum Token")
    
    token = os.getenv("IBM_QUANTUM_TOKEN")
    
    if token:
        print(f"✅ Token found in environment: {token[:10]}...")
        return token
    
    # Try to load from saved account
    try:
        from qiskit_ibm_runtime import QiskitRuntimeService
        service = QiskitRuntimeService()
        account = service.active_account()
        if account:
            print("✅ Token loaded from saved account")
            print(f"   Channel: {account.get('channel', 'unknown')}")
            return "saved"
    except Exception as e:
        pass
    
    print("❌ No token found")
    print("\n💡 Fix: Set your token using one of these methods:")
    print("\n   Method 1 - Environment variable (temporary):")
    print('   $env:IBM_QUANTUM_TOKEN = "your_token_here"')
    print("\n   Method 2 - Save permanently (recommended):")
    print('   python -c "from qiskit_ibm_runtime import QiskitRuntimeService; QiskitRuntimeService.save_account(channel=\'ibm_quantum\', token=\'your_token_here\')"')
    return None

def check_code_changes():
    """Verify that code changes were applied"""
    print_step(3, "Verifying Code Changes")
    
    try:
        with open('ibm_service.py', 'r') as f:
            content = f.read()
        
        # Check for SamplerV2 import
        if 'from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2' in content:
            print("✅ SamplerV2 import found")
        else:
            print("❌ SamplerV2 import not found")
            return False
        
        # Check for new API usage
        if 'sampler = SamplerV2(service=service, backend=backend_name)' in content:
            print("✅ New SamplerV2 API usage found")
        else:
            print("❌ New SamplerV2 API usage not found")
            return False
        
        # Check that old Session import is removed
        if 'from qiskit_ibm_runtime import Sampler, Session' in content:
            print("⚠️  Warning: Old Sampler/Session import still present")
            print("   This might cause conflicts")
        else:
            print("✅ Old Session import removed")
        
        return True
    except FileNotFoundError:
        print("❌ ibm_service.py not found")
        print("   Make sure you're in the backend directory")
        return False

def run_api_test():
    """Run the API signature test"""
    print_step(4, "Running API Signature Test")
    
    try:
        from qiskit_ibm_runtime import SamplerV2, QiskitRuntimeService
        import inspect
        
        sig = inspect.signature(SamplerV2.__init__)
        print(f"✅ SamplerV2.__init__ signature: {sig}")
        
        params = list(sig.parameters.keys())
        if 'service' in params and 'backend' in params:
            print("✅ SamplerV2 accepts 'service' and 'backend' parameters")
            return True
        else:
            print("❌ SamplerV2 signature doesn't match expected")
            return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def test_connection(token):
    """Test connection to IBM Quantum"""
    print_step(5, "Testing IBM Quantum Connection")
    
    if not token:
        print("⏭️  Skipping (no token available)")
        return False
    
    try:
        from qiskit_ibm_runtime import QiskitRuntimeService
        
        if token == "saved":
            service = QiskitRuntimeService()
        else:
            service = QiskitRuntimeService(channel="ibm_quantum", token=token)
        
        account = service.active_account()
        print(f"✅ Connected to IBM Quantum")
        print(f"   Channel: {account.get('channel', 'unknown')}")
        
        # Try to list backends
        backends = list(service.backends(limit=5))
        print(f"✅ Found {len(backends)} backends (showing first 5)")
        for b in backends[:3]:
            print(f"   - {b.name}")
        
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def print_summary(results):
    """Print final summary"""
    print_header("📊 TEST SUMMARY")
    
    total = len(results)
    passed = sum(1 for r in results.values() if r)
    
    for test, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test}")
    
    print(f"\n{'─' * 80}")
    print(f"Total: {passed}/{total} tests passed ({int(passed/total*100)}%)")
    print('─' * 80)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n✅ Your SamplerV2 migration is working correctly!")
        print("\n📋 Next steps:")
        print("   1. Run full integration test: python test_samplerv2_fix.py")
        print("   2. Test from frontend")
        print("   3. Submit a real circuit to IBM hardware")
    else:
        print("\n⚠️  SOME TESTS FAILED")
        print("\n💡 Please fix the failed tests before proceeding")
        print("   See the error messages above for guidance")

def main():
    """Main test runner"""
    print_header("🧪 SAMPLERV2 MIGRATION - VERIFICATION TEST")
    
    print("This script will verify that the SamplerV2 migration was successful.")
    print("It will check imports, code changes, and optionally test the connection.")
    
    results = {}
    
    # Run tests
    results["Package Installation"] = check_imports()
    
    if not results["Package Installation"]:
        print("\n❌ Cannot continue without required packages")
        sys.exit(1)
    
    token = check_token()
    results["Token Available"] = token is not None
    
    results["Code Changes"] = check_code_changes()
    results["API Signature"] = run_api_test()
    results["IBM Connection"] = test_connection(token)
    
    # Print summary
    print_summary(results)
    
    # Exit code
    if all(results.values()):
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
