from typing import List, Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    import numpy as np
else:
    try:
        import numpy as np  # type: ignore
    except ImportError:
        np = None  # type: ignore

class StateVector:
    """
    Quantum state vector implementation using numpy complex arrays
    """
    def __init__(self, size: int):
        self.amplitudes = np.zeros(size, dtype=np.complex128)

    @staticmethod
    def from_array(amplitudes: np.ndarray) -> 'StateVector':
        sv = StateVector(len(amplitudes))
        sv.amplitudes = amplitudes.copy()
        return sv

    @staticmethod
    def from_real_array(reals: List[float], imags: List[float]) -> 'StateVector':
        if len(reals) != len(imags):
            raise ValueError('Real and imaginary arrays must have the same length')
        amplitudes = np.array(reals, dtype=np.float64) + 1j * np.array(imags, dtype=np.float64)
        return StateVector.from_array(amplitudes)

    @property
    def size(self) -> int:
        return len(self.amplitudes)

    @property
    def num_qubits(self) -> int:
        return int(np.log2(self.size))

    def get(self, index: int) -> complex:
        if index < 0 or index >= self.size:
            raise IndexError(f'Index {index} out of bounds for state vector of size {self.size}')
        return complex(self.amplitudes[index])

    def set(self, index: int, value: complex):
        if index < 0 or index >= self.size:
            raise IndexError(f'Index {index} out of bounds for state vector of size {self.size}')
        self.amplitudes[index] = complex(value)

    def initialize_to_basis(self, n: int):
        """Initialize to computational basis state |n⟩"""
        if n < 0 or n >= self.size:
            raise ValueError(f'Basis state {n} out of range for {self.num_qubits} qubits')
        self.amplitudes.fill(0+0j)
        self.amplitudes[n] = 1+0j

    def initialize_to_superposition(self):
        """Initialize to superposition state"""
        amplitude = 1 / np.sqrt(self.size)
        self.amplitudes.fill(amplitude + 0j)

    def initialize_first_qubit(self, alpha: complex, beta: complex):
        """Initialize to custom state for first qubit"""
        if self.num_qubits < 1:
            return

        # Normalize the state
        norm = np.sqrt(abs(alpha)**2 + abs(beta)**2)
        if norm > 0:
            alpha_val = alpha / norm
            beta_val = beta / norm
        else:
            alpha_val = 1+0j
            beta_val = 0+0j

        if self.num_qubits == 1:
            self.amplitudes[0] = alpha_val
            self.amplitudes[1] = beta_val
        else:
            # For multi-qubit systems, initialize first qubit with custom state
            # and other qubits to |0⟩
            for i in range(self.size):
                first_qubit_state = alpha_val if (i & 1) == 0 else beta_val
                self.amplitudes[i] = first_qubit_state

    def normalize(self):
        """Normalize the state vector"""
        norm = np.linalg.norm(self.amplitudes)
        if norm > 0:
            self.amplitudes /= norm

    def apply_unitary(self, unitary: np.ndarray, target_qubits: List[int]):
        """Apply a unitary matrix to the state vector"""
        if len(target_qubits) == 1:
            self._apply_single_qubit_gate(unitary, target_qubits[0])
        elif len(target_qubits) == 2:
            self._apply_two_qubit_gate(unitary, target_qubits[0], target_qubits[1])
        else:
            raise ValueError('Only 1 and 2-qubit gates are supported')

    def _apply_single_qubit_gate(self, gate: np.ndarray, qubit_index: int):
        """Apply single qubit gate"""
        if gate.shape != (2, 2):
            raise ValueError('Single qubit gate must be 2x2 matrix')

        new_amplitudes = np.zeros_like(self.amplitudes)

        for i in range(self.size):
            bit = (i >> qubit_index) & 1
            other_bits = i & ~(1 << qubit_index)

            amp0 = self.amplitudes[other_bits | (0 << qubit_index)]
            amp1 = self.amplitudes[other_bits | (1 << qubit_index)]

            new_amplitudes[i] = gate[bit, 0] * amp0 + gate[bit, 1] * amp1

        self.amplitudes = new_amplitudes

    def _apply_two_qubit_gate(self, gate: np.ndarray, qubit1: int, qubit2: int):
        """Apply two qubit gate"""
        if gate.shape != (4, 4):
            raise ValueError('Two qubit gate must be 4x4 matrix')

        new_amplitudes = np.zeros_like(self.amplitudes)

        for i in range(self.size):
            bit1 = (i >> qubit1) & 1
            bit2 = (i >> qubit2) & 1
            other_bits = i & ~(1 << qubit1) & ~(1 << qubit2)
            state_index = (bit1 << 1) | bit2

            sum_val = 0+0j
            for j in range(4):
                j_bit1 = (j >> 1) & 1
                j_bit2 = j & 1
                j_index = other_bits | (j_bit1 << qubit1) | (j_bit2 << qubit2)
                sum_val += gate[state_index, j] * self.amplitudes[j_index]

            new_amplitudes[i] = sum_val

        self.amplitudes = new_amplitudes

    def measure(self, qubit_index: int) -> Tuple[int, float, 'StateVector']:
        """Measure a qubit in computational basis"""
        prob0 = 0.0
        prob1 = 0.0

        for i in range(self.size):
            bit = (i >> qubit_index) & 1
            magnitude_squared = np.real(self.amplitudes[i] * np.conj(self.amplitudes[i]))
            if bit == 0:
                prob0 += magnitude_squared
            else:
                prob1 += magnitude_squared

        outcome = 0 if np.random.random() < prob0 else 1
        probability = prob0 if outcome == 0 else prob1

        # Create collapsed state
        new_state = StateVector(self.size)
        normalization_factor = 1 / np.sqrt(probability)

        for i in range(self.size):
            bit = (i >> qubit_index) & 1
            if bit == outcome:
                new_state.amplitudes[i] = self.amplitudes[i] * normalization_factor

        return outcome, probability, new_state

    def get_probabilities(self) -> List[float]:
        """Get probabilities for all computational basis states"""
        return [np.real(amp * np.conj(amp)) for amp in self.amplitudes]

    def clone(self) -> 'StateVector':
        """Clone the state vector"""
        return StateVector.from_array(self.amplitudes)

    def to_array(self) -> List[Tuple[float, float]]:
        """Convert to array format for external use"""
        return [(amp.real, amp.imag) for amp in self.amplitudes]

    def get_bloch_vector(self, qubit_index: int) -> Tuple[float, float, float]:
        """Get Bloch vector for a specific qubit"""
        if self.num_qubits == 1:
            # Single qubit case
            alpha = self.amplitudes[0]
            beta = self.amplitudes[1]

            x = 2 * np.real(alpha * np.conj(beta))
            y = 2 * np.imag(alpha * np.conj(beta))
            z = np.real(alpha * np.conj(alpha) - beta * np.conj(beta))

            return x, y, z
        else:
            # Multi-qubit case - compute reduced density matrix
            reduced_dm = self._get_reduced_density_matrix(qubit_index)
            x = 2 * np.real(reduced_dm[0, 1])
            y = 2 * np.imag(reduced_dm[0, 1])
            z = np.real(reduced_dm[0, 0] - reduced_dm[1, 1])

            return x, y, z

    def _get_reduced_density_matrix(self, qubit_index: int) -> np.ndarray:
        """Get reduced density matrix for a qubit"""
        dm = np.zeros((2, 2), dtype=np.complex128)

        for i in range(self.size):
            for j in range(self.size):
                i_bit = (i >> qubit_index) & 1
                j_bit = (j >> qubit_index) & 1

                if i_bit == j_bit:
                    other_bits = i & ~(1 << qubit_index)
                    if other_bits == (j & ~(1 << qubit_index)):
                        dm[i_bit, j_bit] += self.amplitudes[i] * np.conj(self.amplitudes[j])

        return dm

    def get_purity(self, qubit_index: int) -> float:
        """Calculate purity of a qubit (1.0 for pure states, < 1.0 for mixed states)"""
        if self.num_qubits == 1:
            return 1.0  # Pure state

        reduced_dm = self._get_reduced_density_matrix(qubit_index)
        trace_squared = 0+0j

        for i in range(2):
            for j in range(2):
                trace_squared += reduced_dm[i, j] * reduced_dm[j, i]

        return np.real(trace_squared)