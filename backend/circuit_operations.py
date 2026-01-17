"""
Circuit Operations and Gate Application
Converted from TypeScript quantum simulation utilities
"""

from typing import List, Dict, Any, Optional, Tuple, Union, TYPE_CHECKING

if TYPE_CHECKING:
    import numpy as np
    from scipy.linalg import expm
else:
    try:
        import numpy as np  # type: ignore
        from scipy.linalg import expm  # type: ignore
    except ImportError:
        np = None  # type: ignore
        expm = None  # type: ignore

from dataclasses import dataclass
from abc import ABC, abstractmethod


@dataclass
class QuantumGate:
    """Represents a quantum gate"""
    name: str
    qubits: List[int]
    matrix: Optional[np.ndarray] = None
    parameters: Optional[Dict[str, Any]] = None
    position: Optional[int] = None


@dataclass
class QuantumCircuit:
    """Represents a quantum circuit"""
    num_qubits: int
    gates: List[QuantumGate]


# Pauli matrices
PAULI_I = np.array([[1, 0], [0, 1]], dtype=complex)
PAULI_X = np.array([[0, 1], [1, 0]], dtype=complex)
PAULI_Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
PAULI_Z = np.array([[1, 0], [0, -1]], dtype=complex)


def get_gate_matrix(gate_name: str, parameters: Optional[Dict[str, Any]] = None) -> Optional[np.ndarray]:
    """Get the matrix representation of a quantum gate"""
    angle = parameters.get('angle', np.pi/2) if parameters else np.pi/2
    phi = parameters.get('phi', np.pi/4) if parameters else np.pi/4

    gates = {
        'I': PAULI_I,
        'X': PAULI_X,
        'Y': PAULI_Y,
        'Z': PAULI_Z,
        'H': np.array([[1, 1], [1, -1]], dtype=complex) / np.sqrt(2),
        'S': np.array([[1, 0], [0, 1j]], dtype=complex),
        'T': np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]], dtype=complex),
        'RX': expm(-1j * angle / 2 * PAULI_X),
        'RY': expm(-1j * angle / 2 * PAULI_Y),
        'RZ': expm(-1j * angle / 2 * PAULI_Z),
        'P': np.array([[1, 0], [0, np.exp(1j * phi)]], dtype=complex),
        'CNOT': np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]], dtype=complex),
        'CZ': np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, -1]], dtype=complex),
        'SWAP': np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]], dtype=complex),
        'CCNOT': np.array([
            [1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 0, 1, 0]
        ], dtype=complex),
        'FREDKIN': np.array([
            [1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 1]
        ], dtype=complex)
    }

    # Square root gates
    if gate_name == 'SQRTX':
        gates['SQRTX'] = expm(-1j * np.pi / 4 * PAULI_X)
    elif gate_name == 'SQRTY':
        gates['SQRTY'] = expm(-1j * np.pi / 4 * PAULI_Y)
    elif gate_name == 'SQRTZ':
        gates['SQRTZ'] = expm(-1j * np.pi / 4 * PAULI_Z)

    return gates.get(gate_name.upper())


def matrix_multiply(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Matrix multiplication"""
    return np.dot(a, b)


def tensor_product(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Tensor product of two matrices"""
    return np.kron(a, b)


def transpose(matrix: np.ndarray) -> np.ndarray:
    """Matrix transpose"""
    return matrix.T


def create_initial_state(num_qubits: int) -> np.ndarray:
    """Create initial |00...0⟩ state as density matrix"""
    dim = 2 ** num_qubits
    state = np.zeros((dim, dim), dtype=complex)
    state[0, 0] = 1.0  # |00...0⟩⟨00...0|
    return state


def partial_trace(state: np.ndarray, qubit_index: int, num_qubits: int) -> np.ndarray:
    """
    Compute partial trace over a specific qubit using proper tensor operations.

    For a density matrix ρ of n qubits, partial trace over qubit k gives
    a reduced density matrix for the remaining n-1 qubits.
    """
    if num_qubits < 1:
        raise ValueError("Must have at least 1 qubit")
    if not (0 <= qubit_index < num_qubits):
        raise ValueError(f"Qubit index {qubit_index} out of range for {num_qubits} qubits")

    dim = 2 ** num_qubits

    # Reshape density matrix into tensor form: (2, 2, ..., 2, 2, 2, ..., 2)
    # First half: bra indices, second half: ket indices
    tensor_shape = (2,) * (2 * num_qubits)
    rho_tensor = state.reshape(tensor_shape)

    # Determine which axes to trace over
    # For qubit k, we trace over axis k (bra) and axis k+num_qubits (ket)
    trace_axes = [qubit_index, qubit_index + num_qubits]

    # Sum over the traced axes
    reduced_tensor = np.sum(rho_tensor, axis=tuple(trace_axes))

    # Reshape back to matrix form
    reduced_dim = 2 ** (num_qubits - 1)
    return reduced_tensor.reshape((reduced_dim, reduced_dim))


def calculate_bloch_vector(density_matrix: np.ndarray) -> Dict[str, float]:
    """Calculate Bloch vector from density matrix"""
    # For single qubit: ρ = (I + xX + yY + zZ)/2
    # So x = Tr(ρX), y = Tr(ρY), z = Tr(ρZ)

    x = np.real(np.trace(np.dot(density_matrix, PAULI_X)))
    y = np.real(np.trace(np.dot(density_matrix, PAULI_Y)))
    z = np.real(np.trace(np.dot(density_matrix, PAULI_Z)))

    return {'x': x, 'y': y, 'z': z}


def apply_gate(state: np.ndarray, gate: QuantumGate, num_qubits: int) -> np.ndarray:
    """Apply a gate to the quantum state"""
    # Validate inputs
    if not isinstance(state, np.ndarray) or state.shape[0] != state.shape[1]:
        raise ValueError('Invalid state matrix')

    if not isinstance(gate, QuantumGate):
        raise ValueError('Invalid gate object')

    if not isinstance(gate.qubits, list) or len(gate.qubits) == 0:
        raise ValueError(f'Gate {gate.name} has invalid qubits array')

    # Check qubit indices
    for qubit in gate.qubits:
        if not isinstance(qubit, int) or qubit < 0 or qubit >= num_qubits:
            raise ValueError(f'Invalid qubit index {qubit} for {num_qubits}-qubit system')

    # Get gate matrix
    gate_matrix = None
    if gate.matrix is not None:
        if callable(gate.matrix):
            if gate.name.upper() == 'P':
                phi = gate.parameters.get('phi', gate.parameters.get('angle', np.pi/4)) if gate.parameters else np.pi/4
                gate_matrix = gate.matrix(phi)
            else:
                angle = gate.parameters.get('angle', np.pi/2) if gate.parameters else np.pi/2
                gate_matrix = gate.matrix(angle)
        else:
            gate_matrix = gate.matrix
    else:
        gate_matrix = get_gate_matrix(gate.name, gate.parameters)

    if gate_matrix is None:
        raise ValueError(f'Invalid or missing matrix for gate: {gate.name}')

    # Apply gate based on number of qubits
    if len(gate.qubits) == 1:
        return apply_single_qubit_gate(state, gate_matrix, gate.qubits[0], num_qubits)
    elif len(gate.qubits) == 2:
        return apply_two_qubit_gate(state, gate_matrix, gate.qubits[0], gate.qubits[1], num_qubits)
    elif len(gate.qubits) == 3:
        return apply_three_qubit_gate(state, gate_matrix, gate.qubits[0], gate.qubits[1], gate.qubits[2], num_qubits)
    else:
        raise ValueError(f'Unsupported gate with {len(gate.qubits)} qubits')


def apply_single_qubit_gate(state: np.ndarray, gate_matrix: np.ndarray, qubit: int, num_qubits: int) -> np.ndarray:
    """Apply single-qubit gate"""
    # Build the full gate matrix by tensor product
    full_gate = PAULI_I
    for i in range(num_qubits):
        current_gate = gate_matrix if i == qubit else PAULI_I
        full_gate = tensor_product(full_gate, current_gate)

    # Apply: U ρ U†
    u_rho = matrix_multiply(full_gate, state)
    return matrix_multiply(u_rho, transpose(full_gate.conj()))


def apply_two_qubit_gate(state: np.ndarray, gate_matrix: np.ndarray, qubit1: int, qubit2: int, num_qubits: int) -> np.ndarray:
    """Apply two-qubit gate"""
    q_low = min(qubit1, qubit2)
    q_high = max(qubit1, qubit2)
    dim = 2 ** num_qubits
    full_u = np.zeros((dim, dim), dtype=complex)

    for col in range(dim):
        b1 = (col >> q_low) & 1
        b2 = (col >> q_high) & 1
        in_idx = b1 * 2 + b2
        for out in range(4):
            r1 = (out >> 1) & 1  # MSB of 2-bit index
            r2 = out & 1         # LSB
            # Map back to row index
            row = col
            row = (row & (~(1 << q_low))) | (r1 << q_low)
            row = (row & (~(1 << q_high))) | (r2 << q_high)
            full_u[row, col] = gate_matrix[out, in_idx]

    tmp = matrix_multiply(full_u, state)
    return matrix_multiply(tmp, transpose(full_u.conj()))


def apply_three_qubit_gate(state: np.ndarray, gate_matrix: np.ndarray, qubit1: int, qubit2: int, qubit3: int, num_qubits: int) -> np.ndarray:
    """Apply three-qubit gate"""
    qubits = sorted([qubit1, qubit2, qubit3])
    dim = 2 ** num_qubits
    full_u = np.zeros((dim, dim), dtype=complex)

    for col in range(dim):
        b1 = (col >> qubits[0]) & 1
        b2 = (col >> qubits[1]) & 1
        b3 = (col >> qubits[2]) & 1
        in_idx = b1 * 4 + b2 * 2 + b3
        for out in range(8):
            r1 = (out >> 2) & 1  # Bit for qubit1
            r2 = (out >> 1) & 1  # Bit for qubit2
            r3 = out & 1         # Bit for qubit3
            # Map back to row index
            row = col
            row = (row & (~(1 << qubits[0]))) | (r1 << qubits[0])
            row = (row & (~(1 << qubits[1]))) | (r2 << qubits[1])
            row = (row & (~(1 << qubits[2]))) | (r3 << qubits[2])
            full_u[row, col] = gate_matrix[out, in_idx]

    tmp = matrix_multiply(full_u, state)
    return matrix_multiply(tmp, transpose(full_u.conj()))


def simulate_circuit(circuit: QuantumCircuit, initial_state: Optional[Union[np.ndarray, str]] = None) -> Dict[str, Any]:
    """Simulate the full circuit"""
    try:
        num_qubits = circuit.num_qubits
        gates = circuit.gates

        if not num_qubits or not isinstance(gates, list) or num_qubits < 1:
            return {
                'statevector': np.array([]),
                'probabilities': [],
                'density_matrix': np.array([]),
                'reduced_states': [],
                'error': 'Invalid circuit: missing qubits or gates.'
            }

        # Initialize state
        state = None
        if initial_state is not None:
            if isinstance(initial_state, str):
                state = parse_initial_state(initial_state, num_qubits)
            else:
                state = initial_state
        else:
            state = create_initial_state(num_qubits)

        # Apply gates sequentially
        for gate in gates:
            state = apply_gate(state, gate, num_qubits)

        # Compute results
        statevector = state
        probabilities = np.real(np.diag(state))
        density_matrix = state

        # Reduced states for each qubit
        reduced_states = []
        for i in range(num_qubits):
            reduced_states.append(partial_trace(state, i, num_qubits))

        return {
            'statevector': statevector,
            'probabilities': probabilities.tolist(),
            'density_matrix': density_matrix,
            'reduced_states': reduced_states
        }

    except Exception as e:
        return {
            'statevector': np.array([]),
            'probabilities': [],
            'density_matrix': np.array([]),
            'reduced_states': [],
            'error': str(e)
        }


def parse_initial_state(input_str: str, num_qubits: int) -> np.ndarray:
    """Parse initial state from string input"""
    dim = 2 ** num_qubits
    state = np.zeros((dim, dim), dtype=complex)

    try:
        # Handle bra-ket notation
        if '|' in input_str and '⟩' in input_str:
            ket_match = input_str.split('|')[1].split('⟩')[0]
            if ket_match == '+':
                # |+⟩ = (|0⟩ + |1⟩)/√2
                state[0, 0] = 0.5
                state[1, 1] = 0.5
                state[0, 1] = 0.5
                state[1, 0] = 0.5
            elif ket_match == '-':
                # |-⟩ = (|0⟩ - |1⟩)/√2
                state[0, 0] = 0.5
                state[1, 1] = 0.5
                state[0, 1] = -0.5
                state[1, 0] = -0.5
            else:
                # Parse binary string
                index = int(ket_match, 2)
                if 0 <= index < dim:
                    state[index, index] = 1.0
        # Handle vector notation
        elif input_str.startswith('[') and input_str.endswith(']'):
            amplitudes = [complex(x.strip()) for x in input_str[1:-1].split(',')]
            if len(amplitudes) == dim:
                norm = np.sqrt(sum(abs(a)**2 for a in amplitudes))
                normalized_amps = [a / norm for a in amplitudes]
                for i in range(dim):
                    for j in range(dim):
                        state[i, j] = normalized_amps[i] * np.conj(normalized_amps[j])

    except Exception:
        pass

    # Default to |00...0⟩
    if not np.any(state):
        state[0, 0] = 1.0

    return state


# Example circuits
EXAMPLE_CIRCUITS = {
    'Bell State': QuantumCircuit(
        num_qubits=2,
        gates=[
            QuantumGate(name='H', qubits=[0]),
            QuantumGate(name='CNOT', qubits=[0, 1])
        ]
    ),
    'GHZ State (3-qubit)': QuantumCircuit(
        num_qubits=3,
        gates=[
            QuantumGate(name='H', qubits=[0]),
            QuantumGate(name='CNOT', qubits=[0, 1]),
            QuantumGate(name='CNOT', qubits=[0, 2])
        ]
    )
}