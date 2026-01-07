
import numpy as np
import json
from gates import QuantumGates
from quantum_simulator import QuantumSimulator, execute_circuit

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, complex):
            return {"real": obj.real, "imag": obj.imag}
        return super(NumpyEncoder, self).default(obj)

def format_complex(c):
    return f"{c.real:.3f}{'+' if c.imag >= 0 else ''}{c.imag:.3f}j"

def get_matrix_list(matrix):
    rows, cols = matrix.shape
    return [[format_complex(matrix[i, j]) for j in range(cols)] for i in range(rows)]

def verify_all():
    results = {"gates": [], "circuits": []}
    
    # List of gates to check
    single_qubit_gates = ['I', 'X', 'Y', 'Z', 'H', 'S', 'T']
    param_gates = ['RX', 'RY', 'RZ']
    two_qubit_gates = ['CNOT', 'CZ', 'SWAP']

    # 1. Single Qubit Gates
    for gate_name in single_qubit_gates:
        matrix = QuantumGates.get_gate(gate_name)
        
        sim = QuantumSimulator(1)
        sim.initialize_state('ket0')
        sim.apply_gate(gate_name, [0])
        state = sim.get_state_vector()
        
        results["gates"].append({
            "name": gate_name,
            "type": "Single Qubit",
            "matrix": get_matrix_list(matrix),
            "output_on_0": [format_complex(s[0] + 1j*s[1]) for s in state]
        })

    # 2. Parameterized Gates (with pi/2)
    for gate_name in param_gates:
        matrix = QuantumGates.get_gate(gate_name, [np.pi/2])
        
        sim = QuantumSimulator(1)
        sim.initialize_state('ket0')
        sim.apply_gate(gate_name, [0], [np.pi/2])
        state = sim.get_state_vector()
        
        results["gates"].append({
            "name": f"{gate_name}(pi/2)",
            "type": "Parameterized",
            "matrix": get_matrix_list(matrix),
            "output_on_0": [format_complex(s[0] + 1j*s[1]) for s in state]
        })

    # 3. Two Qubit Gates
    for gate_name in two_qubit_gates:
        matrix = QuantumGates.get_gate(gate_name)
        
        gate_res = {
            "name": gate_name,
            "type": "Two Qubit",
            "matrix": get_matrix_list(matrix)
        }
        
        if gate_name == 'CNOT':
            sim = QuantumSimulator(2)
            sim.state_vector.initialize_to_basis(2) 
            sim.apply_gate(gate_name, [1, 0]) 
            state = sim.get_state_vector()
            gate_res["test_case"] = "CNOT on |10> (Control=1, Target=0)"
            gate_res["output_state"] = [format_complex(s[0] + 1j*s[1]) for s in state]

        results["gates"].append(gate_res)

    # 4. Bell State
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
    if result['success']:
        sv = result['qubitResults'][0]['statevector']
        results["circuits"].append({
            "name": "Bell State",
            "description": "H on 0, CNOT 0->1",
            "state_vector": [format_complex(s[0] + 1j*s[1]) for s in sv],
            "concurrence": result['qubitResults'][0]['concurrence'],
            "is_entangled": result['qubitResults'][0]['isEntangled']
        })

    # 5. GHZ State
    circuit_data = {
        'circuit': {
            'numQubits': 3,
            'gates': [
                {'name': 'H', 'qubits': [0]},
                {'name': 'CNOT', 'qubits': [0, 1]},
                {'name': 'CNOT', 'qubits': [1, 2]}
            ]
        },
        'initialState': 'ket0'
    }
    
    result = execute_circuit(circuit_data)
    if result['success']:
        sv = result['qubitResults'][0]['statevector']
        non_zero = {}
        for i, (re, im) in enumerate(sv):
            amp = complex(re, im)
            if abs(amp) > 0.001:
                non_zero[f"|{i:03b}>"] = format_complex(amp)
                
        results["circuits"].append({
            "name": "GHZ State",
            "description": "H on 0, CNOT 0->1, CNOT 1->2",
            "non_zero_amplitudes": non_zero
        })

    with open('verification_report.json', 'w') as f:
        json.dump(results, f, indent=2, cls=NumpyEncoder)

if __name__ == "__main__":
    try:
        verify_all()
        print("Verification JSON generated.")
    except Exception as e:
        print(f"Error: {e}")
