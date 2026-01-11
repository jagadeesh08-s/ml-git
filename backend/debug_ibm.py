
import sys
import traceback

print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")

try:
    import qiskit
    print(f"Qiskit Version: {qiskit.__version__}")
except ImportError:
    print("Qiskit NOT installed")

try:
    import qiskit_ibm_runtime
    from qiskit_ibm_runtime import QiskitRuntimeService
    print(f"Qiskit IBM Runtime Version: {qiskit_ibm_runtime.__version__}")
    print("QiskitRuntimeService imported successfully")
except ImportError:
    print("Qiskit IBM Runtime NOT installed or import failed")
    traceback.print_exc()

try:
    import qiskit_ibm_provider
    print(f"Qiskit IBM Provider Version: {qiskit_ibm_provider.__version__}")
except ImportError:
    print("Qiskit IBM Provider NOT installed (Optional)")

print("\nAttempting to initialize QiskitRuntimeService with empty token (expecting auth error)...")
try:
    # This should fail with "Token is required" or similar, but verify class works
    service = QiskitRuntimeService(token='invalid_token_test', channel='ibm_quantum')
except Exception as e:
    print(f"Caught expected exception during init: {e}")
