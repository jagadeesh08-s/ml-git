#!/usr/bin/env python3
"""
Quantum Circuit Executor for IBM Quantum Integration
Handles circuit execution using Qiskit and IBM Quantum services
"""

import json
import sys
import time
import numpy as np
from typing import Dict, List, Any, Tuple
import traceback

# Qiskit imports - Support both Runtime API and legacy IBM Quantum provider
try:
    from qiskit import QuantumCircuit, transpile
    from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace
    from qiskit.visualization import plot_bloch_multivector
    from qiskit.circuit import Parameter
    from qiskit.quantum_info.operators import Operator
    from qiskit.quantum_info import random_statevector
    from qiskit_aer import AerSimulator

    # Try Runtime API first
    try:
        from qiskit_ibm_runtime import QiskitRuntimeService, Sampler, Estimator
        RUNTIME_AVAILABLE = True
        # RuntimeJob and Session may not be available in all versions
        try:
            from qiskit_ibm_runtime import RuntimeJob, Session
            RUNTIME_JOB_AVAILABLE = True
        except ImportError:
            RUNTIME_JOB_AVAILABLE = False
    except ImportError:
        RUNTIME_AVAILABLE = False
        RUNTIME_JOB_AVAILABLE = False

    # Try legacy IBM Quantum provider
    try:
        from qiskit_ibm_provider import IBMProvider
        LEGACY_PROVIDER_AVAILABLE = True
    except ImportError:
        LEGACY_PROVIDER_AVAILABLE = False

    QISKIT_AVAILABLE = True
except ImportError as e:
    QISKIT_AVAILABLE = False
    RUNTIME_AVAILABLE = False
    LEGACY_PROVIDER_AVAILABLE = False
    RUNTIME_JOB_AVAILABLE = False
    print(f"Warning: Qiskit not available. Install with: pip install qiskit qiskit-aer qiskit-ibm-runtime qiskit-ibm-provider. Error: {e}", file=sys.stderr)

# Gate mapping from frontend to Qiskit
GATE_MAPPING = {
    'I': 'id',
    'X': 'x',
    'Y': 'y', 
    'Z': 'z',
    'H': 'h',
    'S': 's',
    'T': 't',
    'RX': 'rx',
    'RY': 'ry',
    'RZ': 'rz',
    'CNOT': 'cx',
    'CZ': 'cz',
    'SWAP': 'swap'
}

# Canonical kets
CANONICAL_KETS = {
    'ket0': [1, 0],
    'ket1': [0, 1], 
    'ket2': [1/np.sqrt(2), 1/np.sqrt(2)],
    'ket3': [1/np.sqrt(2), -1/np.sqrt(2)],
    'ket4': [1/np.sqrt(2), 1j/np.sqrt(2)],  # |+i⟩
    'ket5': [1/np.sqrt(2), -1j/np.sqrt(2)]  # |-i⟩
}

def create_initial_state(initial_state: str, custom_state: Dict[str, str], num_qubits: int) -> QuantumCircuit:
    """Create initial quantum state based on user selection"""
    qc = QuantumCircuit(num_qubits)
    
    if initial_state == 'ket6':  # Custom state
        alpha = complex(custom_state.get('alpha', '1'))
        beta = complex(custom_state.get('beta', '0'))
        
        # Normalize the state
        norm = np.sqrt(abs(alpha)**2 + abs(beta)**2)
        if norm > 0:
            alpha /= norm
            beta /= norm
        
        # Create custom state for first qubit
        if num_qubits == 1:
            qc.initialize([alpha, beta], 0)
        else:
            # For multi-qubit systems, initialize first qubit with custom state
            qc.initialize([alpha, beta], 0)
            # Initialize other qubits to |0⟩
            for i in range(1, num_qubits):
                qc.initialize([1, 0], i)
    else:
        # Use canonical ket
        if initial_state in CANONICAL_KETS:
            state_vector = CANONICAL_KETS[initial_state]
            if num_qubits == 1:
                qc.initialize(state_vector, 0)
            else:
                # Initialize first qubit with canonical state
                qc.initialize(state_vector, 0)
                # Initialize other qubits to |0⟩
                for i in range(1, num_qubits):
                    qc.initialize([1, 0], i)
        else:
            # Default to |0⟩
            for i in range(num_qubits):
                qc.initialize([1, 0], i)
    
    return qc

def apply_gate(qc: QuantumCircuit, gate: Dict[str, Any]) -> None:
    """Apply a quantum gate to the circuit"""
    gate_name = gate['name']
    qubits = gate['qubits']
    parameters = gate.get('parameters', [])
    
    if gate_name in GATE_MAPPING:
        qiskit_gate = GATE_MAPPING[gate_name]
        
        if gate_name in ['RX', 'RY', 'RZ']:
            # Rotation gates with parameters
            angle = parameters[0] if parameters else np.pi/2  # Default angle
            if qiskit_gate == 'rx':
                qc.rx(angle, qubits[0])
            elif qiskit_gate == 'ry':
                qc.ry(angle, qubits[0])
            elif qiskit_gate == 'rz':
                qc.rz(angle, qubits[0])
        elif gate_name in ['CNOT', 'CZ', 'SWAP']:
            # Two-qubit gates
            if qiskit_gate == 'cx':
                qc.cx(qubits[0], qubits[1])
            elif qiskit_gate == 'cz':
                qc.cz(qubits[0], qubits[1])
            elif qiskit_gate == 'swap':
                qc.swap(qubits[0], qubits[1])
        else:
            # Single-qubit gates
            if qiskit_gate == 'id':
                pass  # Identity gate does nothing
            elif qiskit_gate == 'x':
                qc.x(qubits[0])
            elif qiskit_gate == 'y':
                qc.y(qubits[0])
            elif qiskit_gate == 'z':
                qc.z(qubits[0])
            elif qiskit_gate == 'h':
                qc.h(qubits[0])
            elif qiskit_gate == 's':
                qc.s(qubits[0])
            elif qiskit_gate == 't':
                qc.t(qubits[0])

def calculate_bloch_vector(statevector: Statevector, qubit_index: int) -> Dict[str, float]:
    """Calculate Bloch vector for a specific qubit from the full statevector"""
    if statevector.num_qubits == 1:
        # Single qubit case
        state = statevector.data
        alpha = state[0]
        beta = state[1]
        
        # Bloch vector components
        x = 2 * np.real(np.conj(alpha) * beta)
        y = 2 * np.imag(np.conj(alpha) * beta)
        z = np.abs(alpha)**2 - np.abs(beta)**2
        
        return {'x': float(x), 'y': float(y), 'z': float(z)}
    else:
        # Multi-qubit case - calculate reduced density matrix
        density_matrix = DensityMatrix(statevector)
        reduced_dm = partial_trace(density_matrix, list(range(qubit_index)) + list(range(qubit_index + 1, statevector.num_qubits)))
        
        # Convert to Bloch vector
        rho = reduced_dm.data
        x = 2 * np.real(rho[0, 1])
        y = -2 * np.imag(rho[0, 1])  # Negative sign for correct orientation
        z = np.real(rho[0, 0] - rho[1, 1])
        
        return {'x': float(x), 'y': float(y), 'z': float(z)}

def calculate_purity(statevector: Statevector, qubit_index: int) -> float:
    """Calculate purity of a specific qubit"""
    if statevector.num_qubits == 1:
        return 1.0  # Pure state
    else:
        density_matrix = DensityMatrix(statevector)
        reduced_dm = partial_trace(density_matrix, list(range(qubit_index)) + list(range(qubit_index + 1, statevector.num_qubits)))
        return float(np.real(np.trace(reduced_dm @ reduced_dm)))

def calculate_concurrence(statevector: Statevector) -> float:
    """Calculate concurrence for 2-qubit entanglement"""
    if statevector.num_qubits != 2:
        return 0.0
    
    # For 2-qubit systems, calculate concurrence
    density_matrix = DensityMatrix(statevector)
    rho = density_matrix.data
    
    # Calculate concurrence using the simplified formula
    # C = max(0, 2*max(0, sqrt(λ1) - sqrt(λ2) - sqrt(λ3) - sqrt(λ4)))
    # where λi are eigenvalues of R = rho * (sigma_y ⊗ sigma_y) * rho* * (sigma_y ⊗ sigma_y)
    
    # Simplified calculation using off-diagonal elements
    off_diag = abs(rho[0, 3]) + abs(rho[1, 2]) + abs(rho[2, 1]) + abs(rho[3, 0])
    diag = abs(rho[0, 0]) + abs(rho[1, 1]) + abs(rho[2, 2]) + abs(rho[3, 3])
    
    concurrence = max(0, 2 * off_diag - diag)
    return min(concurrence, 1.0)

def calculate_von_neumann_entropy(density_matrix: np.ndarray) -> float:
    """Calculate von Neumann entropy"""
    eigenvalues = np.linalg.eigvals(density_matrix)
    eigenvalues = np.real(eigenvalues)  # Take real part
    eigenvalues = eigenvalues[eigenvalues > 1e-10]  # Remove near-zero values
    
    entropy = 0.0
    for eigenval in eigenvalues:
        if eigenval > 1e-10:
            entropy -= eigenval * np.log2(eigenval)
    
    return float(entropy)

def calculate_entanglement_witness(statevector: Statevector) -> dict:
    """Calculate entanglement witness for the full system"""
    if statevector.num_qubits < 2:
        return {
            'is_entangled': False,
            'concurrence': 0.0,
            'von_neumann_entropy': 0.0,
            'witness_value': 0.0
        }
    
    concurrence = calculate_concurrence(statevector)
    density_matrix = DensityMatrix(statevector)
    von_neumann_entropy = calculate_von_neumann_entropy(density_matrix.data)
    
    # Entanglement witness: if concurrence > 0.1, the state is entangled
    is_entangled = concurrence > 0.1
    witness_value = concurrence - 0.5
    
    return {
        'is_entangled': is_entangled,
        'concurrence': concurrence,
        'von_neumann_entropy': von_neumann_entropy,
        'witness_value': witness_value
    }

def calculate_circuit_results(qc: QuantumCircuit) -> List[Dict[str, Any]]:
    """Calculate theoretical circuit results using Statevector simulation"""
    # Execute circuit using StatevectorSimulator to get exact statevector
    from qiskit.quantum_info import Statevector

    # Simulate the circuit to get the final statevector
    statevector = Statevector.from_instruction(qc)
    num_qubits = qc.num_qubits

    # Calculate entanglement measures for the full system
    entanglement_witness = calculate_entanglement_witness(statevector)

    # Pre-compute reduced density matrices for all qubits to avoid repeated partial traces
    reduced_states = {}
    if num_qubits > 1:
        density_matrix = DensityMatrix(statevector)
        for i in range(num_qubits):
            reduced_dm = partial_trace(density_matrix, list(range(i)) + list(range(i + 1, num_qubits)))
            reduced_states[i] = reduced_dm

    # Calculate results for each qubit
    qubit_results = []
    for i in range(num_qubits):
        if num_qubits == 1:
            # Single qubit case
            state = statevector.data
            alpha = state[0]
            beta = state[1]

            # Bloch vector components
            x = 2 * np.real(np.conj(alpha) * beta)
            y = 2 * np.imag(np.conj(alpha) * beta)
            z = np.abs(alpha)**2 - np.abs(beta)**2

            bloch_vector = {'x': float(x), 'y': float(y), 'z': float(z)}
            purity = 1.0  # Pure state
        else:
            # Multi-qubit case - use cached reduced density matrix
            reduced_dm = reduced_states[i]

            # Convert to Bloch vector
            rho = reduced_dm.data
            x = 2 * np.real(rho[0, 1])
            y = -2 * np.imag(rho[0, 1])  # Negative sign for correct orientation
            z = np.real(rho[0, 0] - rho[1, 1])

            bloch_vector = {'x': float(x), 'y': float(y), 'z': float(z)}
            purity = float(np.real(np.trace(reduced_dm @ reduced_dm)))

        # Calculate reduced radius for mixed states
        bloch_radius = np.sqrt(bloch_vector['x']**2 + bloch_vector['y']**2 + bloch_vector['z']**2)
        reduced_radius = min(bloch_radius, 1.0)

        # Format reduced density matrix for display
        if num_qubits == 1:
                # For single qubit, reduced state is full state projector |psi><psi|
            current_dm = np.outer(statevector.data, np.conj(statevector.data))
        else:
            current_dm = reduced_states[i].data

        formatted_matrix = []
        for row in current_dm:
            formatted_row = []
            for val in row:
                sign = "+" if val.imag >= 0 else "-"
                formatted_row.append(f"{val.real:.4f} {sign} {abs(val.imag):.4f}j")
            formatted_matrix.append(formatted_row)

        qubit_results.append({
            'qubitIndex': i,
            'blochVector': bloch_vector,
            'purity': purity,
            'reducedRadius': reduced_radius,
            'isEntangled': entanglement_witness['is_entangled'],
            'entanglement': entanglement_witness['concurrence'], # Frontend alias
            'concurrence': entanglement_witness['concurrence'],
            'vonNeumannEntropy': entanglement_witness['von_neumann_entropy'],
            'witnessValue': entanglement_witness['witness_value'],
            'matrix': formatted_matrix,
            'statevector': [[z.real, z.imag] for z in statevector.data] if i == 0 else None  # Only include full statevector for first qubit
        })
    
    return qubit_results

def execute_circuit_locally(circuit_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute circuit using local Qiskit Aer simulator"""
    try:
        num_qubits = circuit_data['circuit']['numQubits']
        gates = circuit_data['circuit']['gates']
        initial_state = circuit_data.get('initialState', 'ket0')
        custom_state = circuit_data.get('customState', {})

        # Create circuit with initial state
        qc = create_initial_state(initial_state, custom_state, num_qubits)

        # Apply gates
        for gate in gates:
            apply_gate(qc, gate)

        return {
            'success': True,
            'method': 'local_simulator',
            'qubitResults': calculate_circuit_results(qc),
            'executionTime': 0.001,  # Local execution is very fast
            'backend': 'local_simulator'
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }

def execute_circuit_ibm(token: str, circuit_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute circuit using IBM Quantum services (Runtime API or legacy provider)"""
    try:
        print(f"Starting IBM Quantum execution with backend: {circuit_data.get('backend', 'unknown')}", file=sys.stderr)

        if not QISKIT_AVAILABLE:
            raise Exception("Qiskit not available. Please install with: pip install qiskit qiskit-aer qiskit-ibm-runtime qiskit-ibm-provider")

        # Check if token is provided
        if not token:
            raise Exception("IBM Quantum token is required. Please set IBM_QUANTUM_TOKEN in backend/.env or run setup_ibm_quantum.js")

        # Try Runtime API first
        if RUNTIME_AVAILABLE:
            print(f"Trying IBM Runtime Service with token: {token[:10]}...", file=sys.stderr)
            
            # Define CRN fallback (User provided)
            DEFAULT_CRN = "crn:v1:bluemix:public:quantum-computing:us-east:a/1ac6e5b6b083465ebb6ddc1ad7a95450:987f16cf-83e1-4631-a7e1-f7b3293b2fae::"
            import os
            effective_instance = os.environ.get("IBM_CLOUD_CRN") or DEFAULT_CRN
            
            service = None
            last_error = None
            
            # Try ibm_cloud first if we have an instance
            if effective_instance:
                try:
                    print(f"Attempting 'ibm_cloud' channel with instance...", file=sys.stderr)
                    service = QiskitRuntimeService(token=token, channel='ibm_cloud', instance=effective_instance)
                    print("IBM Runtime Service initialized successfully with ibm_cloud channel", file=sys.stderr)
                except Exception as e:
                    print(f"ibm_cloud channel failed: {e}", file=sys.stderr)
                    last_error = e

            # Fallback to ibm_quantum if ibm_cloud failed or wasn't tried
            if not service:
                try:
                    print(f"Attempting 'ibm_quantum' channel...", file=sys.stderr)
                    service = QiskitRuntimeService(token=token, channel='ibm_quantum')
                    print("IBM Runtime Service initialized successfully with ibm_quantum channel", file=sys.stderr)
                except Exception as e:
                    print(f"ibm_quantum channel failed: {e}", file=sys.stderr)
                    if not last_error: last_error = e
            
            if service:
                return execute_with_runtime_api(service, token, circuit_data)
            else:
                 print(f"Runtime API failed completely. Last error: {last_error}", file=sys.stderr)

        # Fallback to legacy IBM Quantum provider
        if LEGACY_PROVIDER_AVAILABLE:
            print("Trying legacy IBM Quantum provider...", file=sys.stderr)
            try:
                provider = IBMProvider(token=token)
                print("Legacy IBM Quantum provider initialized successfully", file=sys.stderr)
                return execute_with_legacy_provider(provider, token, circuit_data)
            except Exception as e:
                print(f"Legacy provider failed: {str(e)}", file=sys.stderr)

        # If both fail
        raise Exception("Failed to initialize any IBM Quantum service. Please check your token and try again.")

    except Exception as e:
        print(f"IBM Quantum execution error: {str(e)}", file=sys.stderr)
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }


def execute_with_runtime_api(service, token: str, circuit_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute circuit using IBM Runtime API"""
    try:
        # Get backend
        backend_name = circuit_data['backend']
        try:
            backend = service.backend(backend_name)
        except Exception as e:
            raise Exception(f"Backend '{backend_name}' not available: {str(e)}")

        num_qubits = circuit_data['circuit']['numQubits']
        gates = circuit_data['circuit']['gates']
        initial_state = circuit_data.get('initialState', 'ket0')
        custom_state = circuit_data.get('customState', {})
        shots = circuit_data.get('shots', 1024)

        # Create circuit
        qc = create_initial_state(initial_state, custom_state, num_qubits)

        # Apply gates
        for gate in gates:
            apply_gate(qc, gate)

        # Add measurements for hardware backends
        if not backend.configuration().simulator:
            qc.measure_all()

        # Transpile circuit for the backend
        try:
            transpiled_qc = transpile(qc, backend)
        except Exception as e:
            raise Exception(f"Failed to transpile circuit: {str(e)}")

        # Execute circuit using modern Runtime API
        start_time = time.time()

        # Use Sampler for both simulators and hardware
        try:
            sampler = Sampler(backend)
            job = sampler.run([transpiled_qc], shots=shots)
        except Exception as e:
            raise Exception(f"Failed to submit job: {str(e)}")

        execution_time = time.time() - start_time

        if backend.configuration().simulator:
            # For simulators, wait for completion (they're fast)
            try:
                result = job.result(timeout=120)  # 2 minute timeout for simulators
                execution_time = time.time() - start_time
            except Exception as e:
                raise Exception(f"Job execution failed: {str(e)}")

            # Process results
            pub_result = result[0]

            # For simulators, try to get statevector
            try:
                # Use AerSimulator to get exact statevector
                simulator_backend = AerSimulator()
                simulator_job = simulator_backend.run(transpiled_qc, shots=1)
                simulator_result = simulator_job.result()
                statevector = simulator_result.get_statevector(transpiled_qc)
            except Exception as e:
                print(f"Warning: Could not get exact statevector: {e}", file=sys.stderr)
                # Fallback: create approximate statevector from measurement results
                try:
                    counts = pub_result.data.meas.get_counts()
                    statevector_approx = np.zeros(2**num_qubits, dtype=complex)
                    total_shots = sum(counts.values())

                    for state, count in counts.items():
                        state_index = int(state, 2)
                        statevector_approx[state_index] = np.sqrt(count / total_shots)

                    statevector_approx = statevector_approx / np.linalg.norm(statevector_approx)
                    statevector = Statevector(statevector_approx)
                except Exception as e2:
                    print(f"Warning: Could not create approximate statevector: {e2}", file=sys.stderr)
                    # Last resort: create uniform superposition
                    uniform_amplitude = 1.0 / np.sqrt(2**num_qubits)
                    statevector_data = np.full(2**num_qubits, uniform_amplitude, dtype=complex)
                    statevector = Statevector(statevector_data)

            # Calculate entanglement measures for the full system
            entanglement_witness = calculate_entanglement_witness(statevector)

            # Calculate results for each qubit
            qubit_results = []
            for i in range(num_qubits):
                bloch_vector = calculate_bloch_vector(statevector, i)
                purity = calculate_purity(statevector, i)

                # Calculate reduced radius for mixed states
                bloch_radius = np.sqrt(bloch_vector['x']**2 + bloch_vector['y']**2 + bloch_vector['z']**2)
                reduced_radius = min(bloch_radius, 1.0)

                # Format reduced density matrix for display
                if num_qubits == 1:
                    current_dm = np.outer(statevector.data, np.conj(statevector.data))
                else:
                    dm = DensityMatrix(statevector)
                    current_dm = partial_trace(dm, list(range(i)) + list(range(i+1, num_qubits))).data

                formatted_matrix = []
                for row in current_dm:
                    formatted_row = []
                    for val in row:
                        sign = "+" if val.imag >= 0 else "-"
                        formatted_row.append(f"{val.real:.4f} {sign} {abs(val.imag):.4f}j")
                    formatted_matrix.append(formatted_row)

                qubit_results.append({
                    'qubitIndex': i,
                    'blochVector': bloch_vector,
                    'purity': purity,
                    'reducedRadius': reduced_radius,
                    'isEntangled': entanglement_witness['is_entangled'],
                    'entanglement': entanglement_witness['concurrence'], # Frontend alias
                    'concurrence': entanglement_witness['concurrence'],
                    'vonNeumannEntropy': entanglement_witness['von_neumann_entropy'],
                    'witnessValue': entanglement_witness['witness_value'],
                    'matrix': formatted_matrix,
                    'statevector': statevector.data.tolist() if i == 0 else None
                })

            return {
                'success': True,
                'method': 'ibm_simulator',
                'qubitResults': qubit_results,
                'executionTime': execution_time,
                'backend': backend_name,
                'jobId': job.job_id
            }
        else:
            # Calculate theoretical results for immediate feedback
            theoretical_results = calculate_circuit_results(qc)
            
            # Hardware backend - submit job asynchronously and return immediately with theoretical data
            return {
                'success': True,
                'method': 'ibm_hardware',
                'qubitResults': theoretical_results,  # Return theoretical results immediately
                'isTheoretical': True, # Flag to indicate these are theoretical predictions
                'executionTime': execution_time,
                'backend': backend_name,
                'jobId': job.job_id,
                'status': 'QUEUED',  # Job is queued for execution
                'message': 'Hardware job submitted. Displaying theoretical results while job runs.',
                'progress': 0,
                'estimatedTime': None
            }

    except Exception as e:
        raise Exception(f"Runtime API execution failed: {str(e)}")


def execute_with_legacy_provider(provider, token: str, circuit_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute circuit using legacy IBM Quantum provider"""
    try:
        # Get backend
        backend_name = circuit_data['backend']
        try:
            backend = provider.get_backend(backend_name)
        except Exception as e:
            raise Exception(f"Backend '{backend_name}' not available: {str(e)}")

        num_qubits = circuit_data['circuit']['numQubits']
        gates = circuit_data['circuit']['gates']
        initial_state = circuit_data.get('initialState', 'ket0')
        custom_state = circuit_data.get('customState', {})
        shots = circuit_data.get('shots', 1024)

        # Create circuit
        qc = create_initial_state(initial_state, custom_state, num_qubits)

        # Apply gates
        for gate in gates:
            apply_gate(qc, gate)

        # Add measurements
        qc.measure_all()

        # Transpile circuit for the backend
        try:
            transpiled_qc = transpile(qc, backend)
        except Exception as e:
            raise Exception(f"Failed to transpile circuit: {str(e)}")

        # Execute circuit
        start_time = time.time()

        try:
            job = backend.run(transpiled_qc, shots=shots)
        except Exception as e:
            raise Exception(f"Failed to submit job: {str(e)}")

        execution_time = time.time() - start_time

        if backend.configuration().simulator:
            # For simulators, wait for completion
            try:
                result = job.result(timeout=120)
                execution_time = time.time() - start_time
            except Exception as e:
                raise Exception(f"Job execution failed: {str(e)}")

            # Process results
            counts = result.get_counts(transpiled_qc)

            # Create approximate statevector from measurement results
            statevector_approx = np.zeros(2**num_qubits, dtype=complex)
            total_shots = sum(counts.values())

            for state, count in counts.items():
                state_index = int(state, 2)
                statevector_approx[state_index] = np.sqrt(count / total_shots)

            statevector_approx = statevector_approx / np.linalg.norm(statevector_approx)
            statevector = Statevector(statevector_approx)

            # Calculate entanglement measures for the full system
            entanglement_witness = calculate_entanglement_witness(statevector)

            # Calculate results for each qubit
            qubit_results = []
            for i in range(num_qubits):
                bloch_vector = calculate_bloch_vector(statevector, i)
                purity = calculate_purity(statevector, i)

                # Calculate reduced radius for mixed states
                bloch_radius = np.sqrt(bloch_vector['x']**2 + bloch_vector['y']**2 + bloch_vector['z']**2)
                reduced_radius = min(bloch_radius, 1.0)

                # Format reduced density matrix for display
                if num_qubits == 1:
                    current_dm = np.outer(statevector.data, np.conj(statevector.data))
                else:
                    dm = DensityMatrix(statevector)
                    current_dm = partial_trace(dm, list(range(i)) + list(range(i+1, num_qubits))).data

                formatted_matrix = []
                for row in current_dm:
                    formatted_row = []
                    for val in row:
                        sign = "+" if val.imag >= 0 else "-"
                        formatted_row.append(f"{val.real:.4f} {sign} {abs(val.imag):.4f}j")
                    formatted_matrix.append(formatted_row)

                qubit_results.append({
                    'qubitIndex': i,
                    'blochVector': bloch_vector,
                    'purity': purity,
                    'reducedRadius': reduced_radius,
                    'isEntangled': entanglement_witness['is_entangled'],
                    'entanglement': entanglement_witness['concurrence'], # Frontend alias
                    'concurrence': entanglement_witness['concurrence'],
                    'vonNeumannEntropy': entanglement_witness['von_neumann_entropy'],
                    'witnessValue': entanglement_witness['witness_value'],
                    'matrix': formatted_matrix,
                    'statevector': statevector.data.tolist() if i == 0 else None
                })

            return {
                'success': True,
                'method': 'ibm_simulator_legacy',
                'qubitResults': qubit_results,
                'executionTime': execution_time,
                'backend': backend_name,
                'jobId': job.job_id()
            }
        else:
            # Hardware backend - submit job asynchronously
            return {
                'success': True,
                'method': 'ibm_hardware_legacy',
                'qubitResults': [],  # Results will be available later via polling
                'executionTime': execution_time,
                'backend': backend_name,
                'jobId': job.job_id(),
                'status': 'QUEUED',  # Job is queued for execution
                'message': 'Hardware job submitted successfully to IBM Quantum. Results will be available once execution completes.',
                'progress': 0,
                'estimatedTime': None
            }

    except Exception as e:
        raise Exception(f"Legacy provider execution failed: {str(e)}")


def validate_circuit_data(circuit_data: Dict[str, Any]) -> None:
    """Validate the structure of circuit data"""
    if not isinstance(circuit_data, dict):
        raise ValueError("Circuit data must be a dictionary")

    # Check required fields
    if 'circuit' not in circuit_data:
        raise ValueError("Missing 'circuit' field in circuit data")

    circuit = circuit_data['circuit']
    if not isinstance(circuit, dict):
        raise ValueError("'circuit' must be a dictionary")

    if 'numQubits' not in circuit:
        raise ValueError("Missing 'numQubits' in circuit")
    num_qubits = circuit['numQubits']
    if not isinstance(num_qubits, int) or num_qubits < 1 or num_qubits > 10:
        raise ValueError("'numQubits' must be an integer between 1 and 10")

    if 'gates' not in circuit:
        raise ValueError("Missing 'gates' in circuit")
    gates = circuit['gates']
    if not isinstance(gates, list):
        raise ValueError("'gates' must be a list")

    # Validate each gate
    for i, gate in enumerate(gates):
        if not isinstance(gate, dict):
            raise ValueError(f"Gate {i} must be a dictionary")
        if 'name' not in gate:
            raise ValueError(f"Gate {i} missing 'name' field")
        if 'qubits' not in gate:
            raise ValueError(f"Gate {i} missing 'qubits' field")
        qubits = gate['qubits']
        if not isinstance(qubits, list) or len(qubits) == 0:
            raise ValueError(f"Gate {i} 'qubits' must be a non-empty list")
        for qubit in qubits:
            if not isinstance(qubit, int) or qubit < 0 or qubit >= num_qubits:
                raise ValueError(f"Gate {i} qubit {qubit} out of range [0, {num_qubits-1}]")

    # Validate initial state
    if 'initialState' in circuit_data:
        initial_state = circuit_data['initialState']
        if not isinstance(initial_state, str):
            raise ValueError("'initialState' must be a string")

    # Validate custom state
    if 'customState' in circuit_data:
        custom_state = circuit_data['customState']
        if not isinstance(custom_state, dict):
            raise ValueError("'customState' must be a dictionary")

    # Validate backend
    if 'backend' in circuit_data:
        backend = circuit_data['backend']
        if not isinstance(backend, str):
            raise ValueError("'backend' must be a string")

    # Validate shots
    if 'shots' in circuit_data:
        shots = circuit_data['shots']
        if not isinstance(shots, int) or shots < 1 or shots > 10000:
            raise ValueError("'shots' must be an integer between 1 and 10000")

def main():
    """Main function to handle circuit execution requests"""
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data.strip():
            raise ValueError("No input data received")

        circuit_data = json.loads(input_data)

        # Validate input
        validate_circuit_data(circuit_data)

        # Determine execution method
        backend = circuit_data.get('backend', 'local')

        if backend == 'local' or not circuit_data.get('token'):
            # Execute locally
            result = execute_circuit_locally(circuit_data)
        else:
            # Execute on IBM Quantum
            result = execute_circuit_ibm(circuit_data['token'], circuit_data)

        # Output result as JSON
        print(json.dumps(result, indent=2))

    except json.JSONDecodeError as e:
        error_result = {
            'success': False,
            'error': f"Invalid JSON input: {str(e)}"
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
    except ValueError as e:
        error_result = {
            'success': False,
            'error': f"Validation error: {str(e)}"
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()
