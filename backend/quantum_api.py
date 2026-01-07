#!/usr/bin/env python3
"""
Quantum API Service - Unified interface for quantum circuit execution
Supports multiple backends: local simulation, Qiskit Aer, IBM Quantum hardware/simulator,
and custom Python simulators
"""

import json
import time
import asyncio
import traceback
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from enum import Enum
import os
import numpy as np

# Import existing modules
from quantum_executor import execute_circuit_locally, execute_circuit_ibm, validate_circuit_data
from qiskit_simulator import QiskitQuantumSimulator, execute_circuit as execute_custom_simulator

# Try to import from quantum_simulation, but handle import errors gracefully
try:
    from quantum_simulation import simulate_circuit, create_initial_state, calculate_bloch_vector
    QUANTUM_SIMULATION_AVAILABLE = True
except ImportError:
    QUANTUM_SIMULATION_AVAILABLE = False
    print("Warning: quantum_simulation module not available due to import issues")

# Qiskit imports for transpilation and optimization
try:
    from qiskit import QuantumCircuit, transpile
    from qiskit.transpiler import PassManager
    from qiskit.transpiler.passes import Optimize1qGates, CommutativeCancellation
    QISKIT_AVAILABLE = True
except ImportError as e:
    QISKIT_AVAILABLE = False
    print(f"Warning: Qiskit not available. Error: {e}")
    traceback.print_exc()

# IBM Quantum imports
try:
    from qiskit_ibm_runtime import QiskitRuntimeService
    IBM_RUNTIME_AVAILABLE = True
except ImportError as e:
    IBM_RUNTIME_AVAILABLE = False
    print(f"Warning: IBM Runtime not available. Error: {e}")
    traceback.print_exc()


class BackendType(Enum):
    """Supported backend types"""
    LOCAL = "local"
    AER_SIMULATOR = "aer_simulator"
    IBM_SIMULATOR = "ibm_simulator"
    IBM_HARDWARE = "ibm_hardware"
    CUSTOM_SIMULATOR = "custom_simulator"
    WASM = "wasm"  # For future WebAssembly support


@dataclass
class QuantumExecutionOptions:
    """Options for quantum circuit execution"""
    backend: BackendType
    token: Optional[str] = None
    shots: int = 1024
    initial_state: str = "ket0"
    custom_state: Optional[Dict[str, str]] = None
    optimization_level: int = 1
    optimization_level: int = 1
    enable_transpilation: bool = True
    backend_name: Optional[str] = None


@dataclass
class QuantumExecutionResult:
    """Result of quantum circuit execution"""
    success: bool
    method: str
    backend: str
    execution_time: float
    qubit_results: Optional[List[Dict[str, Any]]] = None
    job_id: Optional[str] = None
    status: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


@dataclass
class JobStatus:
    """Status of a quantum job"""
    job_id: str
    status: str
    status_message: str
    progress: float
    estimated_time: Optional[float] = None
    backend: Optional[str] = None
    results: Optional[Any] = None


class QuantumAPI:
    """
    Unified Quantum API Service
    Provides a single interface for executing quantum circuits across multiple backends
    """

    def __init__(self):
        self.active_jobs: Dict[str, Dict[str, Any]] = {}
        self.backend_cache: Dict[str, Any] = {}

    async def execute_quantum_circuit(
        self,
        circuit: Dict[str, Any],
        options: QuantumExecutionOptions
    ) -> QuantumExecutionResult:
        """
        Execute a quantum circuit on the specified backend
        """
        start_time = time.time()

        try:
            # Validate circuit data
            validate_circuit_data({
                'circuit': circuit,
                'initialState': options.initial_state,
                'customState': options.custom_state,
                'backend': options.backend.value,
                'shots': options.shots
            })

            # Route to appropriate backend
            if options.backend == BackendType.WASM:
                # WebAssembly simulation (placeholder for future implementation)
                return await self._execute_wasm_simulation(circuit, options)

            elif options.backend in [BackendType.AER_SIMULATOR, BackendType.IBM_SIMULATOR, BackendType.IBM_HARDWARE]:
                return await self._execute_ibm_backend(circuit, options)

            elif options.backend == BackendType.CUSTOM_SIMULATOR:
                return await self._execute_custom_simulator(circuit, options)

            else:  # LOCAL or default
                return await self._execute_local_simulation(circuit, options)

        except Exception as e:
            execution_time = time.time() - start_time
            return QuantumExecutionResult(
                success=False,
                method="error",
                backend=options.backend.value,
                execution_time=execution_time,
                error=str(e)
            )

    async def _execute_wasm_simulation(
        self,
        circuit: Dict[str, Any],
        options: QuantumExecutionOptions
    ) -> QuantumExecutionResult:
        """
        Execute circuit using WebAssembly simulation
        Currently falls back to custom simulator
        """
        try:
            # For now, use custom simulator as fallback
            # In future, this could integrate with WebAssembly modules
            result = await self._execute_custom_simulator(circuit, options)
            result.method = "wasm_simulator"
            result.backend = "wasm"
            return result

        except Exception as e:
            return QuantumExecutionResult(
                success=False,
                method="wasm_error",
                backend="wasm",
                execution_time=0.0,
                error=f"WebAssembly execution failed: {str(e)}"
            )

    async def _execute_ibm_backend(
        self,
        circuit: Dict[str, Any],
        options: QuantumExecutionOptions
    ) -> QuantumExecutionResult:
        """
        Execute circuit on IBM Quantum backends
        """
        try:
            # Prepare circuit data for IBM execution
            circuit_data = {
                'token': options.token,
                'backend': options.backend_name if options.backend_name else self._map_backend_to_ibm(options.backend),
                'circuit': circuit,
                'initialState': options.initial_state,
                'customState': options.custom_state or {'alpha': '1', 'beta': '0'},
                'shots': options.shots
            }

            # Transpile circuit if enabled
            if options.enable_transpilation and QISKIT_AVAILABLE:
                circuit_data['circuit'] = self._transpile_circuit(circuit, options.optimization_level)

            # Execute using existing IBM executor
            result = execute_circuit_ibm(options.token, circuit_data)

            return QuantumExecutionResult(
                success=result.get('success', False),
                method=result.get('method', 'ibm_execution'),
                backend=result.get('backend', options.backend.value),
                execution_time=result.get('executionTime', 0.0),
                qubit_results=result.get('qubitResults'),
                job_id=result.get('jobId'),
                status=result.get('status'),
                message=result.get('message'),
                error=result.get('error')
            )

        except Exception as e:
            return QuantumExecutionResult(
                success=False,
                method="ibm_error",
                backend=options.backend.value,
                execution_time=0.0,
                error=f"IBM Quantum execution failed: {str(e)}"
            )

    async def _execute_custom_simulator(
        self,
        circuit: Dict[str, Any],
        options: QuantumExecutionOptions
    ) -> QuantumExecutionResult:
        """
        Execute circuit using custom high-performance simulator
        """
        try:
            # Prepare circuit data
            circuit_data = {
                'circuit': circuit,
                'initialState': options.initial_state,
                'customState': options.custom_state
            }

            # Execute using custom simulator
            result = execute_custom_simulator(circuit_data)

            return QuantumExecutionResult(
                success=result.get('success', False),
                method="custom_simulator",
                backend="custom_simulator",
                execution_time=result.get('executionTime', 0.0),
                qubit_results=result.get('qubitResults'),
                error=result.get('error')
            )

        except Exception as e:
            return QuantumExecutionResult(
                success=False,
                method="custom_simulator_error",
                backend="custom_simulator",
                execution_time=0.0,
                error=f"Custom simulator execution failed: {str(e)}"
            )

    async def _execute_local_simulation(
        self,
        circuit: Dict[str, Any],
        options: QuantumExecutionOptions
    ) -> QuantumExecutionResult:
        """
        Execute circuit using local Qiskit-based simulation
        """
        try:
            # Prepare circuit data
            circuit_data = {
                'circuit': circuit,
                'initialState': options.initial_state,
                'customState': options.custom_state,
                'shots': options.shots
            }

            # Transpile circuit if enabled
            if options.enable_transpilation and QISKIT_AVAILABLE:
                circuit_data['circuit'] = self._transpile_circuit(circuit, options.optimization_level)

            # Execute using existing local executor
            result = execute_circuit_locally(circuit_data)

            return QuantumExecutionResult(
                success=result.get('success', False),
                method=result.get('method', 'local_simulator'),
                backend=result.get('backend', 'local'),
                execution_time=result.get('executionTime', 0.0),
                qubit_results=result.get('qubitResults'),
                error=result.get('error')
            )

        except Exception as e:
            return QuantumExecutionResult(
                success=False,
                method="local_error",
                backend="local",
                execution_time=0.0,
                error=f"Local simulation failed: {str(e)}"
            )

    def _map_backend_to_ibm(self, backend: BackendType) -> str:
        """Map our backend types to IBM backend names"""
        mapping = {
            BackendType.AER_SIMULATOR: "simulator_statevector",
            BackendType.IBM_SIMULATOR: "ibmq_qasm_simulator",
            BackendType.IBM_HARDWARE: "ibmq_manila"  # Default hardware backend
        }
        return mapping.get(backend, "ibmq_qasm_simulator")

    def _transpile_circuit(self, circuit: Dict[str, Any], optimization_level: int) -> Dict[str, Any]:
        """
        Transpile and optimize the circuit using Qiskit
        """
        if not QISKIT_AVAILABLE:
            return circuit

        try:
            # Convert our circuit format to Qiskit
            qc = self._convert_to_qiskit_circuit(circuit)

            # Create optimization passes based on level
            passes = []
            if optimization_level >= 1:
                passes.extend([Optimize1qGates(), CommutativeCancellation()])
            if optimization_level >= 2:
                # CXCancellation removed in Qiskit 2.0
                pass

            # Apply optimization passes
            if passes:
                pm = PassManager(passes)
                qc = pm.run(qc)

            # Transpile for optimization
            if optimization_level >= 1:
                qc = transpile(qc, optimization_level=optimization_level)

            # Convert back to our format
            return self._convert_from_qiskit_circuit(qc)

        except Exception as e:
            print(f"Warning: Circuit transpilation failed: {e}")
            return circuit  # Return original circuit on failure

    def _convert_to_qiskit_circuit(self, circuit: Dict[str, Any]) -> QuantumCircuit:
        """Convert our circuit format to Qiskit QuantumCircuit"""
        num_qubits = circuit['numQubits']
        qc = QuantumCircuit(num_qubits)

        # Apply gates
        for gate in circuit['gates']:
            gate_name = gate['name']
            qubits = gate['qubits']
            params = gate.get('parameters', [])

            if gate_name == 'I':
                pass  # Identity
            elif gate_name == 'X':
                qc.x(qubits[0])
            elif gate_name == 'Y':
                qc.y(qubits[0])
            elif gate_name == 'Z':
                qc.z(qubits[0])
            elif gate_name == 'H':
                qc.h(qubits[0])
            elif gate_name == 'S':
                qc.s(qubits[0])
            elif gate_name == 'T':
                qc.t(qubits[0])
            elif gate_name == 'RX':
                qc.rx(params[0] if params else np.pi/2, qubits[0])
            elif gate_name == 'RY':
                qc.ry(params[0] if params else np.pi/2, qubits[0])
            elif gate_name == 'RZ':
                qc.rz(params[0] if params else np.pi/2, qubits[0])
            elif gate_name == 'CNOT':
                qc.cx(qubits[0], qubits[1])
            elif gate_name == 'CZ':
                qc.cz(qubits[0], qubits[1])
            elif gate_name == 'SWAP':
                qc.swap(qubits[0], qubits[1])

        return qc

    def _convert_from_qiskit_circuit(self, qc: QuantumCircuit) -> Dict[str, Any]:
        """Convert Qiskit QuantumCircuit back to our format"""
        gates = []
        for instruction in qc.data:
            gate_name = instruction.operation.name.upper()
            qubits = [qubit.index for qubit in instruction.qubits]
            params = [float(p) for p in instruction.operation.params] if hasattr(instruction.operation, 'params') else []

            gates.append({
                'name': gate_name,
                'qubits': qubits,
                'parameters': params
            })

        return {
            'numQubits': qc.num_qubits,
            'gates': gates
        }

    async def get_job_status(self, job_id: str, token: Optional[str] = None) -> JobStatus:
        """
        Get the status of a quantum job from IBM Quantum
        """
        try:
            if not token:
                raise Exception("Token is required to get job status")
            
            if not IBM_RUNTIME_AVAILABLE:
                raise Exception("IBM Runtime not available")
            
            print(f"DEBUG: Getting job status for {job_id} with token {token[:10]}...", flush=True)
            
            # Connect to IBM Quantum
            service = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: QiskitRuntimeService(token=token, channel='ibm_quantum')
            )
            
            # Get the job
            job = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: service.job(job_id)
            )
            
            # Get job status
            status = job.status()
            
            print(f"DEBUG: Job {job_id} status: {status}", flush=True)
            
            # Map IBM status to our status format
            status_map = {
                'QUEUED': 'QUEUED',
                'VALIDATING': 'QUEUED',
                'RUNNING': 'RUNNING',
                'COMPLETED': 'COMPLETED',
                'FAILED': 'FAILED',
                'CANCELLED': 'CANCELLED'
            }
            
            mapped_status = status_map.get(str(status), 'UNKNOWN')
            
            # Calculate progress based on status
            progress_map = {
                'QUEUED': 10.0,
                'VALIDATING': 20.0,
                'RUNNING': 50.0,
                'COMPLETED': 100.0,
                'FAILED': 0.0,
                'CANCELLED': 0.0
            }
            
            progress = progress_map.get(mapped_status, 0.0)
            
            return JobStatus(
                job_id=job_id,
                status=mapped_status,
                status_message=f"Job {mapped_status.lower()}",
                progress=progress,
                estimated_time=None,
                backend=job.backend().name if hasattr(job, 'backend') else "unknown",
                results=None
            )

        except Exception as e:
            print(f"ERROR: Failed to get job status: {str(e)}", flush=True)
            traceback.print_exc()
            return JobStatus(
                job_id=job_id,
                status="ERROR",
                status_message=f"Failed to get job status: {str(e)}",
                progress=0.0,
                estimated_time=None
            )

    async def get_job_result(self, job_id: str, token: Optional[str] = None) -> Dict[str, Any]:
        """
        Get the result of a completed quantum job from IBM Quantum
        """
        try:
            if not token:
                raise Exception("Token is required to get job result")
            
            if not IBM_RUNTIME_AVAILABLE:
                raise Exception("IBM Runtime not available")
            
            print(f"DEBUG: Getting job result for {job_id} with token {token[:10]}...", flush=True)
            
            # Connect to IBM Quantum
            service = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: QiskitRuntimeService(token=token, channel='ibm_quantum')
            )
            
            # Get the job
            job = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: service.job(job_id)
            )
            
            # Check job status first
            status = job.status()
            print(f"DEBUG: Job {job_id} status when fetching result: {status}", flush=True)
            
            if str(status) not in ['COMPLETED', 'DONE']:
                # Job not completed yet
                return {
                    'success': True,
                    'jobId': job_id,
                    'status': str(status),
                    'results': None,
                    'executionTime': 0.0,
                    'backend': job.backend().name if hasattr(job, 'backend') else "unknown",
                    'message': f'Job is {status}, not completed yet'
                }
            
            # Get the result
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: job.result()
            )
            
            print(f"DEBUG: Job {job_id} result retrieved successfully", flush=True)
            
            # Extract counts from the result
            # The result structure depends on whether it's from Sampler or legacy execution
            try:
                # Try to get counts from PubResult (Runtime API)
                if hasattr(result, '__getitem__') and len(result) > 0:
                    pub_result = result[0]
                    if hasattr(pub_result, 'data') and hasattr(pub_result.data, 'meas'):
                        counts = pub_result.data.meas.get_counts()
                    else:
                        counts = {}
                else:
                    counts = {}
            except Exception as e:
                print(f"WARNING: Could not extract counts from result: {e}", flush=True)
                counts = {}
            
            # Calculate probabilities
            total_shots = sum(counts.values()) if counts else 0
            probabilities = []
            if total_shots > 0:
                # Sort by bitstring to ensure consistent ordering
                sorted_counts = sorted(counts.items())
                probabilities = [count / total_shots for _, count in sorted_counts]
            
            return {
                'success': True,
                'jobId': job_id,
                'status': 'COMPLETED',
                'results': {
                    'counts': counts,
                    'probabilities': probabilities
                },
                'executionTime': 0.0,  # IBM doesn't provide this in the result
                'backend': job.backend().name if hasattr(job, 'backend') else "unknown"
            }

        except Exception as e:
            print(f"ERROR: Failed to get job result: {str(e)}", flush=True)
            traceback.print_exc()
            return {
                'success': False,
                'jobId': job_id,
                'error': f'Failed to get job result: {str(e)}'
            }

    async def validate_token(self, token: str) -> Tuple[bool, Optional[str]]:
        """
        Validate IBM Quantum token
        """
        if not IBM_RUNTIME_AVAILABLE:
            return False, "IBM Runtime not available"

        try:
            # Test token by attempting to get backends
            service = QiskitRuntimeService(token=token, channel='ibm_quantum')
            await asyncio.get_event_loop().run_in_executor(None, service.backends)
            return True, None

        except Exception as e:
            return False, str(e)

    async def get_available_backends(self, token: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get list of available backends
        """
        print(f"DEBUG: get_available_backends called with token={str(token)[:10]}...", flush=True)
        try:
            # Return standard backends
            backends = [
                {
                    'id': 'local',
                    'name': 'Local Simulator',
                    'status': 'available',
                    'qubits': 24,
                    'type': 'simulator'
                },
                {
                    'id': 'custom_simulator',
                    'name': 'Custom Simulator',
                    'status': 'available',
                    'qubits': 20,
                    'type': 'simulator'
                }
            ]

            # Add IBM backends if token is provided
            print(f"DEBUG: IBM_RUNTIME_AVAILABLE={IBM_RUNTIME_AVAILABLE}", flush=True)
            if token and IBM_RUNTIME_AVAILABLE:
                try:
                    print("DEBUG: Attempting to connect to QiskitRuntimeService...", flush=True)
                    # Use run_in_executor to avoid blocking the event loop
                    service = await asyncio.get_event_loop().run_in_executor(
                        None, 
                        lambda: QiskitRuntimeService(token=token, channel='ibm_quantum')
                    )
                    print("DEBUG: Service created. Fetching backends...", flush=True)
                    
                    ibm_backends = await asyncio.get_event_loop().run_in_executor(None, service.backends)
                    print(f"DEBUG: Found {len(ibm_backends)} IBM backends", flush=True)

                    for backend in ibm_backends:
                        try:
                            # Check status robustly
                            status = backend.status()
                            is_operational = False
                            if hasattr(status, 'operational'):
                                is_operational = status.operational
                            elif isinstance(status, str):
                                is_operational = status == 'active' or status == 'online'
                            else:
                                # Fallback: assume operational if not explicitly told otherwise
                                is_operational = True
                                
                            backends.append({
                                'id': backend.name,
                                'name': backend.name,
                                'status': 'available' if is_operational else 'unavailable',
                                'qubits': backend.num_qubits,
                                'type': 'simulator' if backend.simulator else 'hardware'
                            })
                        except Exception as e:
                            print(f"Warning: Could not check status for {backend.name}: {e}", flush=True)
                            # Add anyway as unavailable if status check fails
                            backends.append({
                                'id': backend.name,
                                'name': backend.name,
                                'status': 'unavailable',
                                'qubits': backend.num_qubits,
                                'type': 'simulator' if backend.simulator else 'hardware'
                            })
                    print("DEBUG: Backend processing complete", flush=True)

                except Exception as e:
                    print(f"Warning: Could not fetch IBM backends: {e}", flush=True)
                    traceback.print_exc()

            print(f"DEBUG: Returning {len(backends)} backends", flush=True)
            return backends

        except Exception as e:
            print(f"Error getting backends: {e}", flush=True)
            traceback.print_exc()
            return []

    async def get_user_jobs(self, token: str) -> List[Dict[str, Any]]:
        """
        Get user's quantum jobs
        """
        if not IBM_RUNTIME_AVAILABLE:
            return []

        try:
            service = QiskitRuntimeService(token=token, channel='ibm_quantum')
            jobs = await asyncio.get_event_loop().run_in_executor(None, service.jobs)

            return [
                {
                    'jobId': job.job_id,
                    'status': job.status,
                    'backend': job.backend,
                    'createdAt': job.created_at.isoformat() if hasattr(job, 'created_at') else None,
                    'completedAt': job.completed_at.isoformat() if hasattr(job, 'completed_at') else None,
                    'progress': 100 if job.status == 'COMPLETED' else 50
                }
                for job in jobs[:10]  # Limit to recent 10 jobs
            ]

        except Exception as e:
            print(f"Error getting user jobs: {e}")
            return []


# Global API instance
quantum_api = QuantumAPI()


async def execute_quantum_circuit(
    circuit: Dict[str, Any],
    options: QuantumExecutionOptions
) -> QuantumExecutionResult:
    """
    Convenience function for executing quantum circuits
    """
    return await quantum_api.execute_quantum_circuit(circuit, options)


async def get_job_status(job_id: str, token: Optional[str] = None) -> JobStatus:
    """
    Convenience function for getting job status
    """
    return await quantum_api.get_job_status(job_id, token)


async def get_job_result(job_id: str, token: Optional[str] = None) -> Dict[str, Any]:
    """
    Convenience function for getting job results
    """
    return await quantum_api.get_job_result(job_id, token)


async def validate_token(token: str) -> Tuple[bool, Optional[str]]:
    """
    Convenience function for token validation
    """
    return await quantum_api.validate_token(token)


async def get_available_backends(token: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Convenience function for getting available backends
    """
    return await quantum_api.get_available_backends(token)


async def get_user_jobs(token: str) -> List[Dict[str, Any]]:
    """
    Convenience function for getting user jobs
    """
    return await quantum_api.get_user_jobs(token)


# Synchronous wrapper for backward compatibility
def execute_quantum_circuit_sync(
    circuit: Dict[str, Any],
    backend: str = 'local',
    token: Optional[str] = None,
    shots: int = 1024,
    initial_state: str = 'ket0',
    custom_state: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Synchronous wrapper for quantum circuit execution
    """
    options = QuantumExecutionOptions(
        backend=BackendType(backend),
        token=token,
        shots=shots,
        initial_state=initial_state,
        custom_state=custom_state
    )

    # Run async function in new event loop
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(execute_quantum_circuit(circuit, options))
        loop.close()

        # Convert result to dict
        return {
            'success': result.success,
            'method': result.method,
            'backend': result.backend,
            'executionTime': result.execution_time,
            'qubitResults': result.qubit_results,
            'jobId': result.job_id,
            'status': result.status,
            'message': result.message,
            'error': result.error
        }

    except Exception as e:
        return {
            'success': False,
            'method': 'error',
            'backend': backend,
            'executionTime': 0.0,
            'error': str(e)
        }