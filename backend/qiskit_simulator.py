import time
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, DensityMatrix, concurrence, entropy, partial_trace
from qiskit.visualization import plot_bloch_vector


class QiskitQuantumSimulator:
    """
    Quantum simulator using Qiskit modules for high-performance simulation
    """

    def __init__(self, num_qubits: int):
        self.num_qubits = num_qubits
        self.circuit = QuantumCircuit(num_qubits)
        self.statevector = None

    def initialize_state(self, initial_state: str, custom_state: Optional[Dict[str, str]] = None):
        """Initialize the quantum state"""
        # Reset circuit
        self.circuit = QuantumCircuit(self.num_qubits)

        if initial_state == 'ket0':
            # Default |0...0⟩ state
            pass
        elif initial_state == 'ket1':
            for i in range(self.num_qubits):
                self.circuit.x(i)
        elif initial_state == 'ket2':  # |+⟩
            for i in range(self.num_qubits):
                self.circuit.h(i)
        elif initial_state == 'ket3':  # |-⟩
            for i in range(self.num_qubits):
                self.circuit.x(i)
                self.circuit.h(i)
        elif initial_state == 'ket4':  # |+i⟩
            for i in range(self.num_qubits):
                self.circuit.h(i)
                self.circuit.s(i)
        elif initial_state == 'ket5':  # |-i⟩
            for i in range(self.num_qubits):
                self.circuit.x(i)
                self.circuit.h(i)
                self.circuit.s(i)
        elif initial_state == 'ket6':  # Custom state
            if custom_state and self.num_qubits >= 1:
                alpha_real = float(custom_state.get('alpha', '1'))
                beta_real = float(custom_state.get('beta', '0'))
                # Initialize first qubit to custom state
                theta = 2 * np.arccos(alpha_real)
                phi = np.angle(beta_real + 0j) if beta_real != 0 else 0
                self.circuit.ry(theta, 0)
                if phi != 0:
                    self.circuit.rz(phi, 0)

    def apply_gate(self, gate_name: str, qubits: List[int], parameters: List[float] = None):
        """Apply a quantum gate to the circuit"""
        if parameters is None:
            parameters = []

        try:
            if gate_name == 'H':
                self.circuit.h(qubits[0])
            elif gate_name == 'X':
                self.circuit.x(qubits[0])
            elif gate_name == 'Y':
                self.circuit.y(qubits[0])
            elif gate_name == 'Z':
                self.circuit.z(qubits[0])
            elif gate_name == 'S':
                self.circuit.s(qubits[0])
            elif gate_name == 'T':
                self.circuit.t(qubits[0])
            elif gate_name == 'RX':
                self.circuit.rx(parameters[0], qubits[0])
            elif gate_name == 'RY':
                self.circuit.ry(parameters[0], qubits[0])
            elif gate_name == 'RZ':
                self.circuit.rz(parameters[0], qubits[0])
            elif gate_name == 'CNOT' or gate_name == 'CX':
                self.circuit.cx(qubits[0], qubits[1])
            elif gate_name == 'CZ':
                self.circuit.cz(qubits[0], qubits[1])
            elif gate_name == 'SWAP':
                self.circuit.swap(qubits[0], qubits[1])
            elif gate_name == 'CCX' or gate_name == 'TOFFOLI':
                self.circuit.ccx(qubits[0], qubits[1], qubits[2])
            elif gate_name == 'U3':
                self.circuit.u(parameters[0], parameters[1], parameters[2], qubits[0])
            elif gate_name == 'U2':
                self.circuit.u(parameters[0], parameters[1], 0, qubits[0])
            elif gate_name == 'U1':
                self.circuit.u(0, 0, parameters[0], qubits[0])
            else:
                raise ValueError(f"Unsupported gate: {gate_name}")
        except Exception as e:
            raise ValueError(f'Failed to apply gate {gate_name}: {str(e)}')

    def apply_gates(self, gates: List[Dict[str, Any]]):
        """Apply multiple gates in sequence"""
        for gate in gates:
            self.apply_gate(gate['name'], gate['qubits'], gate.get('parameters', []))

    def measure(self, qubit_index: int) -> Tuple[int, float]:
        """Measure a specific qubit"""
        # Create a copy of the circuit for measurement
        temp_circuit = self.circuit.copy()
        temp_circuit.measure_all()

        # Get statevector before measurement
        if self.statevector is None:
            self.statevector = Statevector.from_instruction(self.circuit)

        # For measurement, we need to simulate with shots
        # This is a simplified version - in practice you'd use a simulator
        probabilities = self.get_measurement_probabilities()
        outcome = np.random.choice([0, 1], p=[probabilities[qubit_index], 1 - probabilities[qubit_index]])
        probability = probabilities[qubit_index] if outcome == 0 else 1 - probabilities[qubit_index]

        return outcome, probability

    def get_measurement_probabilities(self) -> List[float]:
        """Get measurement probabilities for all qubits"""
        if self.statevector is None:
            self.statevector = Statevector.from_instruction(self.circuit)

        # Get probabilities for each qubit (probability of measuring |0⟩)
        probabilities = []
        for i in range(self.num_qubits):
            # Use Qiskit's built-in probability calculation
            probs = self.statevector.probabilities()
            # For each computational basis state, check if qubit i is 0
            prob_0 = sum(prob for j, prob in enumerate(probs) if (j >> i) & 1 == 0)
            probabilities.append(prob_0)

        return probabilities

    def get_bloch_vector(self, qubit_index: int) -> Dict[str, float]:
        """Get Bloch vector for a specific qubit"""
        if self.statevector is None:
            self.statevector = Statevector.from_instruction(self.circuit)

        # For single qubit, we can compute Bloch vector directly
        if self.num_qubits == 1:
            # |ψ⟩ = α|0⟩ + β|1⟩
            alpha = self.statevector.data[0]
            beta = self.statevector.data[1]
            x = 2 * np.real(alpha * np.conj(beta))
            y = 2 * np.imag(alpha * np.conj(beta))
            z = np.real(alpha * np.conj(alpha) - beta * np.conj(beta))
        else:
            # For multi-qubit systems, compute reduced density matrix
            rho = DensityMatrix.from_instruction(self.circuit)
            # Partial trace over all qubits except the target
            trace_out = [i for i in range(self.num_qubits) if i != qubit_index]
            reduced_rho = partial_trace(rho, trace_out)

            # Calculate Bloch vector components
            x = 2 * np.real(reduced_rho.data[0, 1])
            y = 2 * np.imag(reduced_rho.data[0, 1])
            z = np.real(reduced_rho.data[0, 0] - reduced_rho.data[1, 1])

        return {'x': x, 'y': y, 'z': z}

    def get_purity(self, qubit_index: int) -> float:
        """Get purity of a qubit"""
        if self.statevector is None:
            self.statevector = Statevector.from_instruction(self.circuit)

        if self.num_qubits == 1:
            # For single qubit, purity is always 1 for pure states
            return 1.0
        else:
            # For multi-qubit systems, compute reduced density matrix
            rho = DensityMatrix.from_instruction(self.circuit)
            trace_out = [i for i in range(self.num_qubits) if i != qubit_index]
            reduced_rho = partial_trace(rho, trace_out)
            purity = np.real(np.trace(reduced_rho.data @ reduced_rho.data))

        return purity

    def get_concurrence(self) -> float:
        """Calculate concurrence for 2-qubit entanglement"""
        if self.num_qubits != 2:
            return 0.0

        rho = DensityMatrix.from_instruction(self.circuit)
        return concurrence(rho)

    def get_von_neumann_entropy(self) -> float:
        """Calculate von Neumann entropy"""
        rho = DensityMatrix.from_instruction(self.circuit)
        return entropy(rho)

    def get_state_vector(self) -> List[List[float]]:
        """Get the full state vector as list of [real, imag] pairs"""
        if self.statevector is None:
            self.statevector = Statevector.from_instruction(self.circuit)

        return [[np.real(amp), np.imag(amp)] for amp in self.statevector.data]

    def clone(self) -> 'QiskitQuantumSimulator':
        """Clone the simulator"""
        cloned = QiskitQuantumSimulator(self.num_qubits)
        cloned.circuit = self.circuit.copy()
        cloned.statevector = self.statevector
        return cloned

    def reset(self):
        """Reset to |0...0⟩ state"""
        self.circuit = QuantumCircuit(self.num_qubits)
        self.statevector = None


def execute_circuit(circuit_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a complete quantum circuit using Qiskit
    Matches the JavaScript interface and output format
    """
    start_time = time.time()

    try:
        circuit = circuit_data['circuit']
        initial_state = circuit_data['initialState']
        custom_state = circuit_data.get('customState')

        simulator = QiskitQuantumSimulator(circuit['numQubits'])

        # Initialize state
        simulator.initialize_state(initial_state, custom_state)

        # Apply gates
        simulator.apply_gates(circuit['gates'])

        # Calculate entanglement measures
        concurrence_val = simulator.get_concurrence()
        von_neumann_entropy = simulator.get_von_neumann_entropy()
        is_entangled = concurrence_val > 0.1
        witness_value = concurrence_val - 0.5

        # Calculate results for each qubit
        qubit_results = []
        for i in range(circuit['numQubits']):
            bloch_vector = simulator.get_bloch_vector(i)
            purity = simulator.get_purity(i)
            bloch_radius = np.sqrt(bloch_vector['x']**2 + bloch_vector['y']**2 + bloch_vector['z']**2)
            reduced_radius = min(bloch_radius, 1.0)

            qubit_results.append({
                'qubitIndex': i,
                'blochVector': bloch_vector,
                'purity': purity,
                'reducedRadius': reduced_radius,
                'isEntangled': is_entangled,
                'concurrence': concurrence_val,
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