import numpy as np
import time
from typing import List, Dict, Any, Tuple, Optional
from state_vector import StateVector
from gates import QuantumGates
from complex import Complex

class QuantumSimulator:
    """
    High-performance quantum circuit simulator
    """
    def __init__(self, num_qubits: int):
        self.num_qubits = num_qubits
        self.state_vector = StateVector(1 << num_qubits)

    def initialize_state(self, initial_state: str, custom_state: Optional[Dict[str, Complex]] = None):
        """Initialize the quantum state"""
        if initial_state == 'ket0':
            self.state_vector.initialize_to_basis(0)
        elif initial_state == 'ket1':
            self.state_vector.initialize_to_basis(1)
        elif initial_state == 'ket2':  # |+⟩
            self.state_vector.initialize_to_basis(0)
            self.apply_gate('H', [0])
        elif initial_state == 'ket3':  # |-⟩
            self.state_vector.initialize_to_basis(0)
            self.apply_gate('X', [0])
            self.apply_gate('H', [0])
        elif initial_state == 'ket4':  # |+i⟩
            self.state_vector.initialize_to_basis(0)
            self.apply_gate('H', [0])
            self.apply_gate('S', [0])
        elif initial_state == 'ket5':  # |-i⟩
            self.state_vector.initialize_to_basis(0)
            self.apply_gate('X', [0])
            self.apply_gate('H', [0])
            self.apply_gate('S', [0])
        elif initial_state == 'ket6':  # Custom state
            if custom_state:
                alpha = custom_state.get('alpha', Complex(1, 0))
                beta = custom_state.get('beta', Complex(0, 0))
                self.state_vector.initialize_first_qubit(alpha, beta)
            else:
                self.state_vector.initialize_to_basis(0)
        else:
            self.state_vector.initialize_to_basis(0)

    def apply_gate(self, gate_name: str, qubits: List[int], parameters: List[float] = None):
        """Apply a quantum gate to the circuit"""
        if parameters is None:
            parameters = []
        try:
            gate = QuantumGates.get_gate(gate_name, parameters)
            self.state_vector.apply_unitary(gate, qubits)
        except Exception as e:
            raise ValueError(f'Failed to apply gate {gate_name}: {str(e)}')

    def apply_gates(self, gates: List[Dict[str, Any]]):
        """Apply multiple gates in sequence"""
        for gate in gates:
            self.apply_gate(gate['name'], gate['qubits'], gate.get('parameters', []))

    def measure(self, qubit_index: int) -> Tuple[int, float]:
        """Measure a specific qubit"""
        outcome, probability, new_state = self.state_vector.measure(qubit_index)
        self.state_vector = new_state  # Update to collapsed state
        return outcome, probability

    def get_measurement_probabilities(self) -> List[float]:
        """Get measurement probabilities for all qubits"""
        return self.state_vector.get_probabilities()

    def get_bloch_vector(self, qubit_index: int) -> Tuple[float, float, float]:
        """Get Bloch vector for a specific qubit"""
        return self.state_vector.get_bloch_vector(qubit_index)

    def get_purity(self, qubit_index: int) -> float:
        """Get purity of a qubit"""
        return self.state_vector.get_purity(qubit_index)

    def get_concurrence(self) -> float:
        """Calculate concurrence for 2-qubit entanglement"""
        if self.num_qubits != 2:
            return 0.0

        # For 2-qubit systems, calculate concurrence
        rho = self._compute_density_matrix()

        # Calculate concurrence using simplified formula
        off_diag = abs(rho[0, 3]) + abs(rho[1, 2]) + abs(rho[2, 1]) + abs(rho[3, 0])
        diag = abs(rho[0, 0]) + abs(rho[1, 1]) + abs(rho[2, 2]) + abs(rho[3, 3])

        concurrence = max(0, 2 * off_diag - diag)
        return min(concurrence, 1.0)

    def get_von_neumann_entropy(self) -> float:
        """Calculate von Neumann entropy"""
        rho = self._compute_density_matrix()
        eigenvalues = self._get_matrix_eigenvalues(rho)

        entropy = 0.0
        for eigenval in eigenvalues:
            real_val = np.real(eigenval)
            if real_val > 1e-10:
                entropy -= real_val * np.log2(real_val)

        return entropy

    def get_state_vector(self) -> List[Tuple[float, float]]:
        """Get the full state vector"""
        return self.state_vector.to_array()

    def clone(self) -> 'QuantumSimulator':
        """Clone the simulator"""
        cloned = QuantumSimulator(self.num_qubits)
        cloned.state_vector = self.state_vector.clone()
        return cloned

    def reset(self):
        """Reset to |0...0⟩ state"""
        self.state_vector = StateVector(1 << self.num_qubits)
        self.state_vector.initialize_to_basis(0)

    def _compute_density_matrix(self) -> np.ndarray:
        """Compute density matrix from state vector"""
        size = self.state_vector.size
        rho = np.zeros((size, size), dtype=np.complex128)

        for i in range(size):
            for j in range(size):
                rho[i, j] = self.state_vector.amplitudes[i] * np.conj(self.state_vector.amplitudes[j])

        return rho

    def _get_matrix_eigenvalues(self, matrix: np.ndarray) -> np.ndarray:
        """Get eigenvalues of a matrix"""
        return np.linalg.eigvals(matrix)


def execute_circuit(circuit_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a complete quantum circuit
    """
    start_time = time.time()

    try:
        circuit = circuit_data['circuit']
        initial_state = circuit_data['initialState']
        custom_state = circuit_data.get('customState')

        simulator = QuantumSimulator(circuit['numQubits'])

        # Initialize state
        custom_complex_state = None
        if custom_state:
            custom_complex_state = {
                'alpha': Complex(float(custom_state.get('alpha', 1)), 0),
                'beta': Complex(float(custom_state.get('beta', 0)), 0)
            }

        simulator.initialize_state(initial_state, custom_complex_state)

        # Apply gates
        simulator.apply_gates(circuit['gates'])

        # Calculate entanglement measures
        concurrence = simulator.get_concurrence()
        von_neumann_entropy = simulator.get_von_neumann_entropy()
        is_entangled = concurrence > 0.1
        witness_value = concurrence - 0.5

        # Calculate results for each qubit
        qubit_results = []
        for i in range(circuit['numQubits']):
            bloch_vector = simulator.get_bloch_vector(i)
            purity = simulator.get_purity(i)
            bloch_radius = np.sqrt(bloch_vector[0]**2 + bloch_vector[1]**2 + bloch_vector[2]**2)
            reduced_radius = min(bloch_radius, 1.0)

            qubit_results.append({
                'qubitIndex': i,
                'blochVector': {'x': bloch_vector[0], 'y': bloch_vector[1], 'z': bloch_vector[2]},
                'purity': purity,
                'reducedRadius': reduced_radius,
                'isEntangled': is_entangled,
                'concurrence': concurrence,
                'vonNeumannEntropy': von_neumann_entropy,
                'witnessValue': witness_value,
                'statevector': simulator.get_state_vector() if i == 0 else None
            })

        execution_time = time.time() - start_time

        return {
            'success': True,
            'qubitResults': qubit_results,
            'executionTime': execution_time
        }

    except Exception as e:
        return {
            'success': False,
            'qubitResults': [],
            'executionTime': time.time() - start_time,
            'error': str(e)
        }