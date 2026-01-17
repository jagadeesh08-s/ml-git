"""
Simple startup script for the backend server
This helps diagnose import issues and starts the server
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 80)
print("🚀 STARTING QUANTUM BACKEND SERVER")
print("=" * 80)

print("\n📦 Checking Python version...")
print(f"Python {sys.version}")

print("\n📦 Checking critical imports...")

try:
    print("  ✓ Importing FastAPI...", end=" ")
    from fastapi import FastAPI
    print("OK")
except ImportError as e:
    print(f"FAILED: {e}")
    sys.exit(1)

try:
    print("  ✓ Importing Qiskit...", end=" ")
    import qiskit
    print(f"OK (v{qiskit.__version__})")
except ImportError as e:
    print(f"FAILED: {e}")
    sys.exit(1)

try:
    print("  ✓ Importing Qiskit IBM Runtime...", end=" ")
    import qiskit_ibm_runtime
    version = qiskit_ibm_runtime.__version__ if hasattr(qiskit_ibm_runtime, '__version__') else "unknown"
    print(f"OK (v{version})")
except ImportError as e:
    print(f"FAILED: {e}")
    sys.exit(1)

try:
    print("  ✓ Importing SamplerV2...", end=" ")
    from qiskit_ibm_runtime import SamplerV2
    print("OK")
except ImportError as e:
    print(f"FAILED: {e}")
    print("\n💡 Fix: pip install --upgrade qiskit-ibm-runtime")
    sys.exit(1)

print("\n📦 Importing main application...")
try:
    from main import app
    print("  ✓ Main application imported successfully")
except Exception as e:
    print(f"  ✗ Failed to import main: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n🚀 Starting Uvicorn server...")
print("   Host: 0.0.0.0")
print("   Port: 3005")
print("   Reload: True")
print("\n" + "=" * 80)

try:
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3005,
        reload=True,
        log_level="info"
    )
except KeyboardInterrupt:
    print("\n\n⚠️  Server stopped by user")
except Exception as e:
    print(f"\n\n❌ Server error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
