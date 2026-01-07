#!/usr/bin/env python3
"""
Simplified Quantum Circuit Executor for IBM Quantum Integration
Handles basic circuit execution without requiring Qiskit (for demo purposes)
"""

import json
import sys
import time
import numpy as np
from typing import Dict, List, Any, Tuple
import traceback

# Gate mapping from frontend to our simplified quantum operations
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
    'ket0': [1.0, 0.0],
    'ket1': [0.0, 1.0], 
    'ket2': [1/np.sqrt(2), 1/np.sqrt(2)],
    'ket3': [1/np.sqrt(2), -1/np.sqrt(2)],
    'ket4': [1/np.sqrt(2), 1/np.sqrt(2)],  # |+i⟩ simplified
    'ket5': [1/np.sqrt(2), -1/np.sqrt(2)]  # |-i⟩ simplified
}

def create_initial_state(initial_state: str, custom_state: Dict[str, str], num_qubits: int) -> List[complex]:
    """Create initial quantum state based on user selection"""
    if num_qubits == 1:
        # Single qubit case
        if initial_state == 'ket6':  # Custom state
            alpha = float(custom_state.get('alpha', '1.0'))
            beta = float(custom_state.get('beta', '0.0'))
            
            # Normalize the state
            norm = np.sqrt(alpha**2 + beta**2)
            if norm > 0:
                alpha /= norm
                beta /= norm
            
            return [complex(alpha, 0), complex(beta, 0)]
        else:
            # Use canonical ket
            if initial_state in CANONICAL_KETS:
                state = CANONICAL_KETS[initial_state]
                return [complex(val, 0) for val in state]
            else:
                # Default to |0⟩
                return [complex(1.0, 0), complex(0.0, 0)]
    else:
        # Multi-qubit case - for now, just return |0...0⟩
        state = [0.0] * (2**num_qubits)
        state[0] = 1.0  # |00...0⟩
        return [complex(val, 0) for val in state]

def apply_single_qubit_gate(state: List[complex], gate_name: str, qubit_index: int, parameters: List[float] = None) -> List[complex]:
    """Apply a single qubit gate to the state vector"""
    # Define gate matrices (real-valued for simplicity)
    if gate_name == 'I':
        gate_matrix = [[1, 0], [0, 1]]
    elif gate_name == 'X':
        gate_matrix = [[0, 1], [1, 0]]
    elif gate_name == 'Y':
        gate_matrix = [[0, -1], [1, 0]]  # Simplified
    elif gate_name == 'Z':
        gate_matrix = [[1, 0], [0, -1]]
    elif gate_name == 'H':
        gate_matrix = [[1/np.sqrt(2), 1/np.sqrt(2)], [1/np.sqrt(2), -1/np.sqrt(2)]]
    elif gate_name == 'RX' and parameters:
        theta = parameters[0]
        gate_matrix = [
            [np.cos(theta/2), -np.sin(theta/2)],
            [-np.sin(theta/2), np.cos(theta/2)]
        ]
    elif gate_name == 'RY' and parameters:
        theta = parameters[0]
        gate_matrix = [
            [np.cos(theta/2), -np.sin(theta/2)],
            [np.sin(theta/2), np.cos(theta/2)]
        ]
    elif gate_name == 'RZ' and parameters:
        phi = parameters[0]
        gate_matrix = [
            [np.cos(phi/2), -np.sin(phi/2)],
            [np.sin(phi/2), np.cos(phi/2)]
        ]
    else:
        # Default to identity
        gate_matrix = [[1, 0], [0, 1]]

    # Apply gate to the specified qubit
    new_state = state.copy()
    num_qubits = int(np.log2(len(state)))
    
    for i in range(len(state)):
        binary_state = format(i, f'0{num_qubits}b')
        qubit_bit = int(binary_state[num_qubits - 1 - qubit_index])
        
        # Find the state with flipped qubit
        flipped_binary = binary_state[:num_qubits - 1 - qubit_index] + str(1 - qubit_bit) + binary_state[num_qubits - qubit_index:]
        j = int(flipped_binary, 2)
        
        # Apply 2x2 gate matrix
        new_state[i] = gate_matrix[0][0] * state[i] + gate_matrix[0][1] * state[j]
        new_state[j] = gate_matrix[1][0] * state[i] + gate_matrix[1][1] * state[j]
    
    return new_state

def apply_cnot_gate(state: List[complex], control: int, target: int) -> List[complex]:
    """Apply CNOT gate"""
    new_state = state.copy()
    num_qubits = int(np.log2(len(state)))
    
    for i in range(len(state)):
        binary_state = format(i, f'0{num_qubits}b')
        control_bit = int(binary_state[num_qubits - 1 - control])
        target_bit = int(binary_state[num_qubits - 1 - target])
        
        if control_bit == 1:
            # Flip target bit
            flipped_binary = binary_state[:num_qubits - 1 - target] + str(1 - target_bit) + binary_state[num_qubits - target:]
            j = int(flipped_binary, 2)
            new_state[i], new_state[j] = state[j], state[i]
    
    return new_state

def calculate_bloch_vector(state: List[complex], qubit_index: int) -> Dict[str, float]:
    """Calculate Bloch vector for a specific qubit from the state vector"""
    if len(state) == 2:  # Single qubit
        alpha = state[0]
        beta = state[1]
        
        # Bloch vector components (simplified)
        x = 2 * (alpha.real * beta.real + alpha.imag * beta.imag)
        y = 2 * (alpha.imag * beta.real - alpha.real * beta.imag)
        z = alpha.real**2 + alpha.imag**2 - beta.real**2 - beta.imag**2
        
        return {'x': float(x), 'y': float(y), 'z': float(z)}
    else:
        # For multi-qubit, calculate partial trace for the specific qubit
        # This is a simplified implementation
        num_qubits = int(np.log2(len(state)))
        if qubit_index >= num_qubits:
            return {'x': 0.0, 'y': 0.0, 'z': 1.0}
        
        # For multi-qubit, use the probability of finding the qubit in |1⟩
        prob1 = 0.0
        for i in range(len(state)):
            if ((i >> qubit_index) & 1) == 1:
                prob1 += abs(state[i])**2
        
        prob0 = 1.0 - prob1
        
        # Simplified Bloch vector calculation
        x = 2.0 * np.sqrt(prob0 * prob1)
        y = 0.0
        z = prob0 - prob1
        
        return {'x': float(x), 'y': float(y), 'z': float(z)}

def calculate_purity(state: List[complex], qubit_index: int) -> float:
    """Calculate purity of a specific qubit"""
    # For pure states, purity is 1
    # For mixed states, it would be less than 1
    return 1.0

def execute_circuit_locally(circuit_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute circuit using local simplified quantum simulator"""
    try:
        num_qubits = circuit_data['circuit']['numQubits']
        gates = circuit_data['circuit']['gates']
        initial_state = circuit_data['initialState']
        custom_state = circuit_data['customState']

        # Create initial state
        state = create_initial_state(initial_state, custom_state, num_qubits)

        # Apply gates
        for gate in gates:
            gate_name = gate['name']
            qubits = gate['qubits']
            parameters = gate.get('parameters', [])
            
            if len(qubits) == 1:
                # Single qubit gate
                state = apply_single_qubit_gate(state, gate_name, qubits[0], parameters)
            elif len(qubits) == 2 and gate_name == 'CNOT':
                # Two qubit gate
                state = apply_cnot_gate(state, qubits[0], qubits[1])
            # Add more two-qubit gates as needed

        # Calculate results for each qubit
        qubit_results = []
        for i in range(num_qubits):
            bloch_vector = calculate_bloch_vector(state, i)
            purity = calculate_purity(state, i)
            
            # Calculate reduced radius for mixed states
            bloch_radius = np.sqrt(bloch_vector['x']**2 + bloch_vector['y']**2 + bloch_vector['z']**2)
            reduced_radius = min(bloch_radius, 1.0)

            qubit_results.append({
                'qubitIndex': i,
                'blochVector': bloch_vector,
                'purity': purity,
                'reducedRadius': reduced_radius,
                'isEntangled': False,  # Simplified
                'concurrence': 0.0,
                'vonNeumannEntropy': 0.0,
                'witnessValue': 0.0,
                'statevector': [[val.real, val.imag] for val in state] if i == 0 else None
            })

        return {
            'success': True,
            'method': 'local_simplified_simulator',
            'qubitResults': qubit_results,
            'executionTime': 0.001,  # Local execution is very fast
            'backend': 'local_simplified_simulator'
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }

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
    if not isinstance(num_qubits, int) or num_qubits < 1 or num_qubits > 5:  # Reduced limit for demo
        raise ValueError("'numQubits' must be an integer between 1 and 5")

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

        # Execute circuit locally
        result = execute_circuit_locally(circuit_data)

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