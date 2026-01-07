"""
Lightweight Python ports of selected TypeScript quantum utilities:
- circuitOperations.ts
- densityMatrix.ts
- gates.ts
- precision.ts
- ketState.ts (basic parsing/normalization)

Goals:
- Provide real-valued density-matrix simulation compatible with the TS logic.
- Keep a minimal dependency footprint (numpy only).
- Expose helpers that can be wired into FastAPI endpoints or tests.
"""

from __future__ import annotations

from dataclasses import dataclass
from math import cos, sin, sqrt
from typing import Any, Dict, List, Optional, Tuple

import numpy as np


# ---------------------------------------------------------------------------
# Gate definitions (real-valued approximations, mirroring gates.ts GATES_REAL)
# ---------------------------------------------------------------------------

def _rx(angle: float) -> np.ndarray:
    c, s = cos(angle / 2), sin(angle / 2)
    return np.array([[c, -s], [-s, c]], dtype=float)


def _ry(angle: float) -> np.ndarray:
    c, s = cos(angle / 2), sin(angle / 2)
    return np.array([[c, -s], [s, c]], dtype=float)


def _rz(_: float) -> np.ndarray:
    # Phase rotation is no-op in real approximation; handled in Bloch updates.
    return np.eye(2, dtype=float)


def _p(_: float) -> np.ndarray:
    # Same as RZ in real approximation.
    return np.eye(2, dtype=float)


def _rxx(angle: float) -> np.ndarray:
    c, s = cos(angle / 2), sin(angle / 2)
    return np.array(
        [
            [c, 0, 0, -s],
            [0, c, -s, 0],
            [0, -s, c, 0],
            [-s, 0, 0, c],
        ],
        dtype=float,
    )


def _ryy(angle: float) -> np.ndarray:
    c, s = cos(angle / 2), sin(angle / 2)
    return np.array(
        [
            [c, 0, 0, s],
            [0, c, -s, 0],
            [0, -s, c, 0],
            [s, 0, 0, c],
        ],
        dtype=float,
    )


def _rzz(_: float) -> np.ndarray:
    # Phase-only; identity in real approximation.
    return np.eye(4, dtype=float)


GATES_REAL: Dict[str, Any] = {
    # Single-qubit
    "I": np.array([[1, 0], [0, 1]], dtype=float),
    "X": np.array([[0, 1], [1, 0]], dtype=float),
    "Y": np.array([[0, -1], [1, 0]], dtype=float),  # real approx
    "Z": np.array([[1, 0], [0, -1]], dtype=float),
    "H": np.array([[1 / sqrt(2), 1 / sqrt(2)], [1 / sqrt(2), -1 / sqrt(2)]], dtype=float),
    "S": np.eye(2, dtype=float),  # phase handled in Bloch update
    "T": np.eye(2, dtype=float),  # phase handled in Bloch update
    "SQRTX": np.array([[0.5, -0.5], [0.5, 0.5]], dtype=float),
    "SQRTY": np.array([[0.5, -0.5], [0.5, 0.5]], dtype=float),
    "SQRTZ": np.eye(2, dtype=float),
    # Parametric single-qubit
    "RX": _rx,
    "RY": _ry,
    "RZ": _rz,
    "P": _p,
    # Two-qubit
    "CNOT": np.array(
        [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 1],
            [0, 0, 1, 0],
        ],
        dtype=float,
    ),
    "CZ": np.array(
        [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, -1],
        ],
        dtype=float,
    ),
    "SWAP": np.array(
        [
            [1, 0, 0, 0],
            [0, 0, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 1],
        ],
        dtype=float,
    ),
    "CY": np.array(
        [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, -1],
            [0, 0, 1, 0],
        ],
        dtype=float,
    ),
    "CH": np.array(
        [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1 / sqrt(2), 1 / sqrt(2)],
            [0, 0, 1 / sqrt(2), -1 / sqrt(2)],
        ],
        dtype=float,
    ),
    "RXX": _rxx,
    "RYY": _ryy,
    "RZZ": _rzz,
    # Three-qubit
    "CCNOT": np.array(
        [
            [1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 0, 1, 0],
        ],
        dtype=float,
    ),
    "FREDKIN": np.array(
        [
            [1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 1],
        ],
        dtype=float,
    ),
}


def get_gate_matrix_real(name: str, parameters: Optional[Dict[str, float]] = None) -> np.ndarray:
    gate = GATES_REAL.get(name)
    if gate is None:
        raise ValueError(f"Unknown gate: {name}")
    if callable(gate):
        angle = parameters.get("angle") if parameters else None
        phi = parameters.get("phi") if parameters else None
        val = angle if angle is not None else phi
        if val is None:
            val = np.pi / 2
        return gate(float(val))
    return gate.astype(float)


# ---------------------------------------------------------------------------
# Core data structures
# ---------------------------------------------------------------------------

@dataclass
class Gate:
    name: str
    qubits: List[int]
    parameters: Optional[Dict[str, float]] = None


@dataclass
class Circuit:
    numQubits: int
    gates: List[Gate]


# ---------------------------------------------------------------------------
# Density matrix utilities (real-valued)
# ---------------------------------------------------------------------------

def create_initial_state(num_qubits: int) -> np.ndarray:
    dim = 1 << num_qubits
    state = np.zeros((dim, dim), dtype=float)
    state[0, 0] = 1.0
    return state


def calculate_bloch_vector(rho: np.ndarray) -> Dict[str, float]:
    if rho.shape != (2, 2):
        return {"x": 0.0, "y": 0.0, "z": 1.0}
    a, b = rho[0, 0], rho[1, 1]
    c, d = rho[0, 1], rho[1, 0]
    # Real approximation: off-diagonal real part -> x, imaginary handled separately
    re = (c + d) / 2.0
    im = (c - d) / -2.0  # sign per TS real approximation
    x = 2 * re
    y = 2 * im
    z = a - b
    # clamp
    return {
        "x": float(np.clip(x, -1, 1)),
        "y": float(np.clip(y, -1, 1)),
        "z": float(np.clip(z, -1, 1)),
    }


def partial_trace(full_state: np.ndarray, keep: int, num_qubits: int) -> np.ndarray:
    """Trace out all qubits except `keep` (single-qubit reduced state)."""
    if num_qubits == 1:
        return full_state
    dim_total = 1 << num_qubits
    dim_keep = 2
    reduced = np.zeros((dim_keep, dim_keep), dtype=float)

    for i in range(dim_total):
        for j in range(dim_total):
            # extract bit at position `keep`
            bi = (i >> keep) & 1
            bj = (j >> keep) & 1
            # remove that bit to compare remaining pattern
            ri = i & ~(1 << keep)
            rj = j & ~(1 << keep)
            # shift down bits above keep
            ri = (ri >> 1) if keep else ri
            rj = (rj >> 1) if keep else rj
            if ri == rj:
                reduced[bi, bj] += full_state[i, j]
    return reduced


# ---------------------------------------------------------------------------
# Gate application on density matrices
# ---------------------------------------------------------------------------

def _tensor(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.kron(a, b)


def _apply_single(state: np.ndarray, u: np.ndarray, qubit: int, num_qubits: int) -> np.ndarray:
    full = np.array([[1.0]])
    for q in range(num_qubits):
        full = _tensor(full, u if q == qubit else GATES_REAL["I"])
    tmp = full @ state
    return tmp @ full.T


def _apply_two(state: np.ndarray, u: np.ndarray, q1: int, q2: int, num_qubits: int) -> np.ndarray:
    q_low, q_high = sorted([q1, q2])
    dim = 1 << num_qubits
    full_u = np.zeros((dim, dim), dtype=float)
    for col in range(dim):
        b1 = (col >> q_low) & 1
        b2 = (col >> q_high) & 1
        in_idx = b1 * 2 + b2
        for out in range(4):
            r1 = (out >> 1) & 1
            r2 = out & 1
            row = col
            row = (row & ~(1 << q_low)) | (r1 << q_low)
            row = (row & ~(1 << q_high)) | (r2 << q_high)
            full_u[row, col] += u[out, in_idx]
    tmp = full_u @ state
    return tmp @ full_u.T


def _apply_three(state: np.ndarray, u: np.ndarray, qs: Tuple[int, int, int], num_qubits: int) -> np.ndarray:
    qubits = sorted(qs)
    dim = 1 << num_qubits
    full_u = np.zeros((dim, dim), dtype=float)
    for col in range(dim):
        b1 = (col >> qubits[0]) & 1
        b2 = (col >> qubits[1]) & 1
        b3 = (col >> qubits[2]) & 1
        in_idx = b1 * 4 + b2 * 2 + b3
        for out in range(8):
            r1 = (out >> 2) & 1
            r2 = (out >> 1) & 1
            r3 = out & 1
            row = col
            row = (row & ~(1 << qubits[0])) | (r1 << qubits[0])
            row = (row & ~(1 << qubits[1])) | (r2 << qubits[1])
            row = (row & ~(1 << qubits[2])) | (r3 << qubits[2])
            full_u[row, col] += u[out, in_idx]
    tmp = full_u @ state
    return tmp @ full_u.T


def apply_gate(state: np.ndarray, gate: Gate, num_qubits: int) -> np.ndarray:
    if not gate.qubits:
        return state
    u = get_gate_matrix_real(gate.name, gate.parameters)
    if len(gate.qubits) == 1:
        return _apply_single(state, u, gate.qubits[0], num_qubits)
    if len(gate.qubits) == 2:
        return _apply_two(state, u, gate.qubits[0], gate.qubits[1], num_qubits)
    if len(gate.qubits) == 3:
        return _apply_three(state, u, (gate.qubits[0], gate.qubits[1], gate.qubits[2]), num_qubits)
    return state


# ---------------------------------------------------------------------------
# Simulation
# ---------------------------------------------------------------------------

def parse_initial_state(text: Optional[str], num_qubits: int) -> np.ndarray:
    if not text:
        return create_initial_state(num_qubits)
    dim = 1 << num_qubits
    state = np.zeros((dim, dim), dtype=float)
    try:
        if "|" in text and "⟩" in text:
            ket = text.split("|")[1].split("⟩")[0]
            idx = int(ket, 2) if ket.isdigit() else 0
            if 0 <= idx < dim:
                state[idx, idx] = 1.0
        elif text.startswith("[") and text.endswith("]"):
            amps = [float(x.strip()) for x in text.strip("[]").split(",")]
            if len(amps) == dim:
                norm = sqrt(sum(a * a for a in amps))
                if norm > 0:
                    amps = [a / norm for a in amps]
                    for i in range(dim):
                        for j in range(dim):
                            state[i, j] = amps[i] * amps[j]
    except Exception:
        pass
    if not state.any():
        state[0, 0] = 1.0
    return state


def simulate_circuit(
    circuit: Circuit,
    initial_state: Optional[str | np.ndarray] = None,
) -> Dict[str, Any]:
    num_qubits = circuit.numQubits
    if num_qubits < 1:
        return {"error": "Invalid circuit", "statevector": [], "probabilities": [], "densityMatrix": []}

    if isinstance(initial_state, np.ndarray):
        state = initial_state.astype(float)
    else:
        state = parse_initial_state(initial_state, num_qubits)

    for g in circuit.gates:
        state = apply_gate(state, g, num_qubits)

    probs = [float(state[i, i]) for i in range(state.shape[0])]
    reduced = [partial_trace(state, q, num_qubits) for q in range(num_qubits)]
    bloch = [calculate_bloch_vector(r) for r in reduced]

    return {
        "statevector": state,
        "probabilities": probs,
        "densityMatrix": state,
        "reducedStates": [{"matrix": r, "blochVector": b} for r, b in zip(reduced, bloch)],
    }


# ---------------------------------------------------------------------------
# KetState parsing / validation (minimal)
# ---------------------------------------------------------------------------

def parse_ket_bra(input_str: str) -> List[complex]:
    text = input_str.strip()
    if text in ("|0⟩", "|0>"):
        return [1 + 0j, 0 + 0j]
    if text in ("|1⟩", "|1>"):
        return [0 + 0j, 1 + 0j]
    return [0 + 0j, 0 + 0j]


def parse_ket_vector(input_str: str) -> List[complex]:
    try:
        arr = eval(input_str, {"__builtins__": {}})  # simple safe-ish eval for lists
        if isinstance(arr, list):
            out: List[complex] = []
            for v in arr:
                if isinstance(v, (int, float)):
                    out.append(complex(v, 0))
                elif isinstance(v, str) and v.endswith("i"):
                    out.append(complex(0, float(v[:-1])))
                elif isinstance(v, dict) and "re" in v and "im" in v:
                    out.append(complex(v["re"], v["im"]))
                else:
                    out.append(0 + 0j)
            return out
    except Exception:
        pass
    return []


def normalize_state(vec: List[complex]) -> List[complex]:
    norm = sqrt(sum((abs(v) ** 2) for v in vec))
    if norm == 0:
        return vec
    return [v / norm for v in vec]


def validate_state(vec: List[complex]) -> bool:
    if not vec:
        return False
    norm = sqrt(sum((abs(v) ** 2) for v in vec))
    if abs(norm - 1) > 1e-6:
        return False
    n = len(vec)
    return (n & (n - 1)) == 0  # power of two

