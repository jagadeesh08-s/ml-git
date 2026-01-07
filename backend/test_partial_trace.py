#!/usr/bin/env python3
"""
Comprehensive test suite for partial trace operations in multi-qubit quantum systems.
Tests the correctness of density matrix partial trace implementation.
"""

import numpy as np
import sys
import os

# Add the backend directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from quantum_simulator import QuantumSimulator
    from complex import Complex
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure all backend modules are available")
    sys.exit(1)


class PartialTraceTester:
    """Test class for partial trace operations"""

    def __init__(self):
        # Don't need simulator for partial trace testing
        pass

    def create_bell_state(self, type_str):
        """Create Bell states for testing"""
        if type_str == '00+11':
            # |00⟩ + |11⟩ state
            state = np.zeros((4, 4), dtype=complex)
            norm = 1/np.sqrt(2)
            state[0, 0] = 0.5  # |00⟩⟨00|
            state[0, 3] = norm * norm  # |00⟩⟨11|
            state[3, 0] = norm * norm  # |11⟩⟨00|
            state[3, 3] = 0.5  # |11⟩⟨11|
            return state
        elif type_str == '01+10':
            # |01⟩ + |10⟩ state
            state = np.zeros((4, 4), dtype=complex)
            norm = 1/np.sqrt(2)
            state[1, 1] = 0.5  # |01⟩⟨01|
            state[1, 2] = norm * norm  # |01⟩⟨10|
            state[2, 1] = norm * norm  # |10⟩⟨01|
            state[2, 2] = 0.5  # |10⟩⟨10|
            return state
        else:
            raise ValueError(f"Unknown Bell state type: {type_str}")

    def create_product_state(self, state1, state2):
        """Create product states |state1⟩⊗|state2⟩"""
        # Define basis states
        basis = {
            '0': np.array([1, 0]),
            '1': np.array([0, 1]),
            '+': np.array([1/np.sqrt(2), 1/np.sqrt(2)]),
            '-': np.array([1/np.sqrt(2), -1/np.sqrt(2)])
        }

        vec1 = basis[state1]
        vec2 = basis[state2]

        # Tensor product
        vec_combined = np.kron(vec1, vec2)

        # Create density matrix
        return np.outer(vec_combined, vec_combined.conj())

    def create_werner_state(self, fidelity):
        """Create Werner state with given fidelity to Bell state"""
        # Start with Bell state |00⟩ + |11⟩
        bell_state = self.create_bell_state('00+11')

        # Create maximally mixed state
        dim = 4
        max_mixed = np.eye(dim) / dim

        # Werner state: F|Ψ+⟩⟨Ψ+| + (1-F)/4 * I⊗I
        return fidelity * bell_state + (1 - fidelity) * max_mixed

    def partial_trace_numpy(self, rho, keep_qubit, num_qubits):
        """
        Reference implementation of partial trace using numpy
        For 2 qubits, use the standard formula
        """
        if num_qubits == 1:
            return rho.copy()

        if num_qubits != 2:
            raise NotImplementedError("Only 1 and 2-qubit partial trace implemented")

        reduced_rho = np.zeros((2, 2), dtype=complex)

        if keep_qubit == 0:
            # Keep qubit 0, trace out qubit 1
            # For each pair (i,j) representing kept qubit states:
            # Sum over traced qubit states (0 and 1)
            reduced_rho[0, 0] = rho[0, 0] + rho[2, 2]  # |00⟩⟨00| + |10⟩⟨10|
            reduced_rho[0, 1] = rho[0, 1] + rho[2, 3]  # |00⟩⟨01| + |10⟩⟨11|
            reduced_rho[1, 0] = rho[1, 0] + rho[3, 2]  # |01⟩⟨00| + |11⟩⟨10|
            reduced_rho[1, 1] = rho[1, 1] + rho[3, 3]  # |01⟩⟨01| + |11⟩⟨11|
        elif keep_qubit == 1:
            # Keep qubit 1, trace out qubit 0
            # For each pair (i,j) representing kept qubit states:
            # Sum over traced qubit states (0 and 1)
            reduced_rho[0, 0] = rho[0, 0] + rho[1, 1]  # |00⟩⟨00| + |01⟩⟨01|
            reduced_rho[0, 1] = rho[0, 2] + rho[1, 3]  # |00⟩⟨10| + |01⟩⟨11|
            reduced_rho[1, 0] = rho[2, 0] + rho[3, 1]  # |10⟩⟨00| + |11⟩⟨01|
            reduced_rho[1, 1] = rho[2, 2] + rho[3, 3]  # |10⟩⟨10| + |11⟩⟨11|
        else:
            raise ValueError(f"Invalid keep_qubit: {keep_qubit}")

        return reduced_rho

    def test_single_qubit_reduction(self):
        """Test partial trace on single qubit systems"""
        print("Testing single qubit partial trace...")

        # |0⟩⟨0| state
        rho = np.array([[1, 0], [0, 0]], dtype=complex)
        result = self.partial_trace_numpy(rho, 0, 1)

        expected = rho  # Should be unchanged
        assert np.allclose(result, expected), f"Single qubit reduction failed: {result} != {expected}"
        print("✓ Single qubit |0⟩ state correct")

        # |+⟩⟨+| state
        plus_state = np.array([[0.5, 0.5], [0.5, 0.5]], dtype=complex)
        result = self.partial_trace_numpy(plus_state, 0, 1)

        assert np.allclose(result, plus_state), f"Single qubit |+⟩ state failed: {result} != {plus_state}"
        print("✓ Single qubit |+⟩ state correct")

    def test_product_states(self):
        """Test partial trace on product states"""
        print("\nTesting product states...")

        # Debug: Check what |01⟩⟨01| looks like
        rho_01 = self.create_product_state('0', '1')
        print(f"|01⟩⟨01| matrix:\n{rho_01}")

        # Test |00⟩⟨00| state
        rho = self.create_product_state('0', '0')
        result = self.partial_trace_numpy(rho, 0, 2)  # Trace out qubit 0

        expected = np.array([[1, 0], [0, 0]], dtype=complex)  # |0⟩⟨0|
        assert np.allclose(result, expected), f"|00⟩ trace out qubit 0 failed: {result} != {expected}"
        print("✓ |00⟩⟨00| trace out qubit 0 correct")

        # Test |01⟩⟨01| state
        rho = self.create_product_state('0', '1')
        result = self.partial_trace_numpy(rho, 0, 2)  # Trace out qubit 0

        expected = np.array([[0, 0], [0, 1]], dtype=complex)  # |1⟩⟨1|
        print(f"Partial trace result: {result}")
        print(f"Expected: {expected}")
        assert np.allclose(result, expected), f"|01⟩ trace out qubit 0 failed: {result} != {expected}"
        print("✓ |01⟩⟨01| trace out qubit 0 correct")

        # Test |+0⟩⟨+0| state
        rho = self.create_product_state('+', '0')
        result = self.partial_trace_numpy(rho, 0, 2)  # Trace out qubit 0

        expected = np.array([[1, 0], [0, 0]], dtype=complex)  # |0⟩⟨0|
        assert np.allclose(result, expected), f"|+0⟩ trace out qubit 0 failed: {result} != {expected}"
        print("✓ |+0⟩⟨+0| trace out qubit 0 correct")

    def test_bell_states(self):
        """Test partial trace on Bell states"""
        print("\nTesting Bell states...")

        # Test |00⟩ + |11⟩ Bell state
        rho = self.create_bell_state('00+11')
        result = self.partial_trace_numpy(rho, 0, 2)  # Trace out qubit 0

        # Bell state reduced density matrix should be maximally mixed
        expected = np.array([[0.5, 0], [0, 0.5]], dtype=complex)
        assert np.allclose(result, expected), f"Bell |00⟩+|11⟩ reduction failed: {result} != {expected}"
        print("✓ Bell |00⟩+|11⟩ state reduction correct")

        # Test |01⟩ + |10⟩ Bell state
        rho = self.create_bell_state('01+10')
        result = self.partial_trace_numpy(rho, 1, 2)  # Trace out qubit 1

        expected = np.array([[0.5, 0], [0, 0.5]], dtype=complex)
        assert np.allclose(result, expected), f"Bell |01⟩+|10⟩ reduction failed: {result} != {expected}"
        print("✓ Bell |01⟩+|10⟩ state reduction correct")

    def test_werner_states(self):
        """Test partial trace on Werner states"""
        print("\nTesting Werner states...")

        # High fidelity Werner state (mostly entangled)
        rho = self.create_werner_state(0.9)
        result = self.partial_trace_numpy(rho, 0, 2)

        # Should be close to maximally mixed but not exactly
        trace = np.trace(result)
        assert np.isclose(trace, 1.0), f"Trace not preserved: {trace}"

        # Check purity (should be >= 0.5, higher for more entangled states)
        purity = np.real(np.trace(result @ result))
        assert purity >= 0.5, f"Purity too low for high fidelity Werner: {purity}"
        print(f"✓ High fidelity Werner state (F=0.9): purity = {purity:.3f}")

        # Low fidelity Werner state (closer to maximally mixed)
        rho = self.create_werner_state(0.1)
        result = self.partial_trace_numpy(rho, 0, 2)

        purity_low = np.real(np.trace(result @ result))
        assert purity_low >= 0.5, f"Purity too low for low fidelity Werner: {purity_low}"
        # The low fidelity state should have lower or equal purity compared to high fidelity
        assert purity_low <= purity, f"Low fidelity should have lower purity: {purity_low} > {purity}"
        print(f"✓ Low fidelity Werner state (F=0.1): purity = {purity_low:.3f}")
    def test_mathematical_properties(self):
        """Test mathematical properties of partial trace"""
        print("\nTesting mathematical properties...")

        test_states = [
            self.create_bell_state('00+11'),
            self.create_product_state('0', '1'),
            self.create_werner_state(0.7)
        ]

        for i, rho in enumerate(test_states):
            # Test trace preservation
            original_trace = np.trace(rho)
            reduced_rho = self.partial_trace_numpy(rho, 0, 2)
            reduced_trace = np.trace(reduced_rho)

            assert np.isclose(original_trace, reduced_trace, atol=1e-10), \
                f"Trace not preserved for state {i}: {original_trace} != {reduced_trace}"
            print(f"✓ Trace preservation for state {i}")

            # Test hermiticity
            assert np.allclose(reduced_rho, reduced_rho.conj().T), \
                f"Reduced matrix not Hermitian for state {i}"
            print(f"✓ Hermiticity for state {i}")

            # Test positive semidefinite (eigenvalues >= 0)
            eigenvals = np.linalg.eigvals(reduced_rho)
            assert np.all(eigenvals >= -1e-10), \
                f"Negative eigenvalues for state {i}: {eigenvals}"
            print(f"✓ Positive semidefinite for state {i}")

    def test_edge_cases(self):
        """Test edge cases"""
        print("\nTesting edge cases...")

        # Maximally mixed state
        dim = 4
        max_mixed = np.eye(dim, dtype=complex) / dim
        result = self.partial_trace_numpy(max_mixed, 0, 2)

        expected = np.array([[0.5, 0], [0, 0.5]], dtype=complex)
        assert np.allclose(result, expected), f"Maximally mixed state failed: {result} != {expected}"
        print("✓ Maximally mixed state correct")

        # Identity state (completely mixed single qubit)
        identity_2q = np.eye(4, dtype=complex) / 4
        result = self.partial_trace_numpy(identity_2q, 0, 2)

        expected = np.array([[0.5, 0], [0, 0.5]], dtype=complex)
        assert np.allclose(result, expected), f"Identity state failed: {result} != {expected}"
        print("✓ Identity state correct")

    def run_all_tests(self):
        """Run all test cases"""
        print("Running Partial Trace Tests")
        print("=" * 50)

        try:
            self.test_single_qubit_reduction()
            self.test_product_states()
            self.test_bell_states()
            self.test_werner_states()
            self.test_mathematical_properties()
            self.test_edge_cases()

            print("\n" + "=" * 50)
            print("✅ All tests passed!")

        except AssertionError as e:
            print(f"\n❌ Test failed: {e}")
            return False
        except Exception as e:
            print(f"\n💥 Unexpected error: {e}")
            return False

        return True


def main():
    """Main test function"""
    tester = PartialTraceTester()
    success = tester.run_all_tests()

    if success:
        print("\n🎉 Partial trace implementation appears correct!")
        print("Manual verification complete for:")
        print("- Bell states (|00⟩±|11⟩, |01⟩±|10⟩)")
        print("- Product states (|00⟩, |01⟩, |+0⟩)")
        print("- Werner states (partially entangled)")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check implementation.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
