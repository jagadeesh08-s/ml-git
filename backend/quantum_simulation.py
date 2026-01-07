"""
Quantum simulation utilities for multi-qubit systems
Main entry point that re-exports from modular components
"""

try:
    # Try relative imports first (when imported as module)
    from .circuit_operations import (
        QuantumGate,
        QuantumCircuit,
        get_gate_matrix,
        apply_gate,
        simulate_circuit,
        create_initial_state,
        partial_trace,
        calculate_bloch_vector,
        EXAMPLE_CIRCUITS
    )
except ImportError:
    # Fall back to absolute imports (when run directly)
    from circuit_operations import (
        QuantumGate,
        QuantumCircuit,
        get_gate_matrix,
        apply_gate,
        simulate_circuit,
        create_initial_state,
        partial_trace,
        calculate_bloch_vector,
        EXAMPLE_CIRCUITS
    )

# Matrix operations
def matrix_multiply(a, b):
    """Matrix multiplication"""
    import numpy as np
    return np.dot(a, b)

def tensor_product(a, b):
    """Tensor product of two matrices"""
    import numpy as np
    return np.kron(a, b)

def transpose(matrix):
    """Matrix transpose"""
    import numpy as np
    return matrix.T

def trace(matrix):
    """Matrix trace"""
    import numpy as np
    return np.trace(matrix)

# Legacy exports for backward compatibility
def matrix_trace(matrix):
    return trace(matrix)