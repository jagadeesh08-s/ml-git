import asyncio
from typing import Dict, Any, Optional
from quantum_api_types import BackendType, QuantumExecutionOptions, QuantumExecutionResult
from quantum_executor import execute_circuit_locally
from qiskit_simulator import execute_circuit as execute_qiskit_locally

class QuantumAPI:
    def __init__(self):
        pass

    async def execute_quantum_circuit(self, circuit: Dict[str, Any], options: QuantumExecutionOptions) -> QuantumExecutionResult:
        """
        Execute a quantum circuit on the specified backend
        """
        try:
            circuit_data = {
                "circuit": circuit,
                "initialState": options.initial_state,
                "customState": options.custom_state,
                "shots": options.shots,
                "token": options.token,
                "backend": options.backend_name
            }

            if options.backend == BackendType.LOCAL:
                result = execute_circuit_locally(circuit_data)
            elif options.backend == BackendType.AER_SIMULATOR:
                # Use the complex statevector simulator for AER
                res = execute_qiskit_locally(circuit_data)
                result = {
                    "success": res.get("success", False),
                    "method": "qiskit_simulator",
                    "backend": "aer_simulator",
                    "execution_time": res.get("executionTime", 0),
                    "qubit_results": res.get("qubitResults", []),
                    "error": res.get("error")
                }
            else:
                # Fallback to local
                result = execute_circuit_locally(circuit_data)

            return QuantumExecutionResult(
                success=result.get("success", False),
                method=result.get("method", "local"),
                backend=result.get("backend", "local"),
                execution_time=result.get("executionTime", 0),
                qubit_results=result.get("qubitResults"),
                error=result.get("error")
            )
        except Exception as e:
            return QuantumExecutionResult(
                success=False,
                method="error",
                backend="unknown",
                execution_time=0,
                error=str(e)
            )

def execute_quantum_circuit_sync(circuit: Dict[str, Any], options: QuantumExecutionOptions) -> QuantumExecutionResult:
    api = QuantumAPI()
    return asyncio.run(api.execute_quantum_circuit(circuit, options))
