#!/usr/bin/env python3

from qiskit_simulator import execute_circuit
import json

def test_basic_circuit():
    """Test basic circuit execution"""
    print("Testing basic circuit...")

    circuit_data = {
        'circuit': {
            'numQubits': 1,
            'gates': []
        },
        'initialState': 'ket0'
    }

    result = execute_circuit(circuit_data)
    print(f"Success: {result['success']}")
    print(f"Execution time: {result['executionTime']}")
    print(f"Number of results: {len(result['qubitResults'])}")

    if result['qubitResults']:
        qubit = result['qubitResults'][0]
        print(f"Bloch vector: {qubit['blochVector']}")
        print(f"Purity: {qubit['purity']}")

def test_hadamard_circuit():
    """Test circuit with Hadamard gate"""
    print("\nTesting Hadamard circuit...")

    circuit_data = {
        'circuit': {
            'numQubits': 1,
            'gates': [{'name': 'H', 'qubits': [0]}]
        },
        'initialState': 'ket0'
    }

    result = execute_circuit(circuit_data)
    print(f"Success: {result['success']}")

    if result['qubitResults']:
        qubit = result['qubitResults'][0]
        print(f"Bloch vector: {qubit['blochVector']}")
        print(f"Purity: {qubit['purity']}")

def test_bell_state():
    """Test Bell state circuit"""
    print("\nTesting Bell state...")

    circuit_data = {
        'circuit': {
            'numQubits': 2,
            'gates': [
                {'name': 'H', 'qubits': [0]},
                {'name': 'CNOT', 'qubits': [0, 1]}
            ]
        },
        'initialState': 'ket0'
    }

    result = execute_circuit(circuit_data)
    print(f"Success: {result['success']}")
    if not result['success']:
        print(f"Error: {result.get('error', 'Unknown error')}")
    else:
        print(f"Concurrence: {result['qubitResults'][0]['concurrence'] if result['qubitResults'] else 'N/A'}")

if __name__ == "__main__":
    test_basic_circuit()
    test_hadamard_circuit()
    test_bell_state()
    print("\nAll tests completed!")