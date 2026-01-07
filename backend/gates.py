import numpy as np
from typing import List
from complex import Complex

class QuantumGates:
    """
    Quantum gate definitions and implementations using numpy arrays
    """

    # Pauli gates
    I = np.array([
        [1+0j, 0+0j],
        [0+0j, 1+0j]
    ], dtype=np.complex128)

    X = np.array([
        [0+0j, 1+0j],
        [1+0j, 0+0j]
    ], dtype=np.complex128)

    Y = np.array([
        [0+0j, 0-1j],
        [0+1j, 0+0j]
    ], dtype=np.complex128)

    Z = np.array([
        [1+0j, 0+0j],
        [0+0j, -1+0j]
    ], dtype=np.complex128)

    # Hadamard gate
    H = np.array([
        [1/np.sqrt(2)+0j, 1/np.sqrt(2)+0j],
        [1/np.sqrt(2)+0j, -1/np.sqrt(2)+0j]
    ], dtype=np.complex128)

    # Phase gates
    S = np.array([
        [1+0j, 0+0j],
        [0+0j, 0+1j]
    ], dtype=np.complex128)

    T = np.array([
        [1+0j, 0+0j],
        [0+0j, np.cos(np.pi/4)+1j*np.sin(np.pi/4)]
    ], dtype=np.complex128)

    # Two-qubit gates
    CNOT = np.array([
        [1+0j, 0+0j, 0+0j, 0+0j],
        [0+0j, 1+0j, 0+0j, 0+0j],
        [0+0j, 0+0j, 0+0j, 1+0j],
        [0+0j, 0+0j, 1+0j, 0+0j]
    ], dtype=np.complex128)

    CZ = np.array([
        [1+0j, 0+0j, 0+0j, 0+0j],
        [0+0j, 1+0j, 0+0j, 0+0j],
        [0+0j, 0+0j, 1+0j, 0+0j],
        [0+0j, 0+0j, 0+0j, -1+0j]
    ], dtype=np.complex128)

    SWAP = np.array([
        [1+0j, 0+0j, 0+0j, 0+0j],
        [0+0j, 0+0j, 1+0j, 0+0j],
        [0+0j, 1+0j, 0+0j, 0+0j],
        [0+0j, 0+0j, 0+0j, 1+0j]
    ], dtype=np.complex128)

    @staticmethod
    def rx(theta: float) -> np.ndarray:
        """Rotation around X axis"""
        cos = np.cos(theta/2)
        sin = np.sin(theta/2)
        return np.array([
            [cos+0j, 0-1j*sin],
            [0-1j*sin, cos+0j]
        ], dtype=np.complex128)

    @staticmethod
    def ry(theta: float) -> np.ndarray:
        """Rotation around Y axis"""
        cos = np.cos(theta/2)
        sin = np.sin(theta/2)
        return np.array([
            [cos+0j, -sin+0j],
            [sin+0j, cos+0j]
        ], dtype=np.complex128)

    @staticmethod
    def rz(theta: float) -> np.ndarray:
        """Rotation around Z axis"""
        phase = theta / 2
        return np.array([
            [np.cos(-phase)+1j*np.sin(-phase), 0+0j],
            [0+0j, np.cos(phase)+1j*np.sin(phase)]
        ], dtype=np.complex128)

    @staticmethod
    def get_gate(name: str, parameters: List[float] = None) -> np.ndarray:
        """
        Get gate matrix by name
        """
        if parameters is None:
            parameters = []

        name = name.upper()
        if name == 'I':
            return QuantumGates.I.copy()
        elif name == 'X':
            return QuantumGates.X.copy()
        elif name == 'Y':
            return QuantumGates.Y.copy()
        elif name == 'Z':
            return QuantumGates.Z.copy()
        elif name == 'H':
            return QuantumGates.H.copy()
        elif name == 'S':
            return QuantumGates.S.copy()
        elif name == 'T':
            return QuantumGates.T.copy()
        elif name == 'RX':
            return QuantumGates.rx(parameters[0] if parameters else np.pi/2)
        elif name == 'RY':
            return QuantumGates.ry(parameters[0] if parameters else np.pi/2)
        elif name == 'RZ':
            return QuantumGates.rz(parameters[0] if parameters else np.pi/2)
        elif name in ['CNOT', 'CX']:
            return QuantumGates.CNOT.copy()
        elif name == 'CZ':
            return QuantumGates.CZ.copy()
        elif name == 'SWAP':
            return QuantumGates.SWAP.copy()
        else:
            raise ValueError(f"Unknown gate: {name}")

    @staticmethod
    def is_single_qubit_gate(name: str) -> bool:
        """Check if gate is single-qubit"""
        single_qubit_gates = ['I', 'X', 'Y', 'Z', 'H', 'S', 'T', 'RX', 'RY', 'RZ']
        return name.upper() in single_qubit_gates

    @staticmethod
    def is_two_qubit_gate(name: str) -> bool:
        """Check if gate is two-qubit"""
        two_qubit_gates = ['CNOT', 'CX', 'CZ', 'SWAP']
        return name.upper() in two_qubit_gates

    @staticmethod
    def get_qubit_count(name: str) -> int:
        """Get number of qubits required for gate"""
        if QuantumGates.is_single_qubit_gate(name):
            return 1
        elif QuantumGates.is_two_qubit_gate(name):
            return 2
        else:
            raise ValueError(f"Unknown gate: {name}")