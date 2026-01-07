"""
Utilities to validate/parse Qiskit/Cirq/JSON code into a QuantumCircuit
and drive simulations and step-by-step execution using existing simulator
"""

import json
import re
from typing import List, Dict, Any, Optional, Tuple
try:
    # Try relative imports first (when imported as module)
    from .quantum_simulation import QuantumCircuit, QuantumGate, simulate_circuit
except ImportError:
    # Fall back to absolute imports (when run directly)
    from quantum_simulation import QuantumCircuit, QuantumGate, simulate_circuit


class CodeError:
    def __init__(self, line: int, message: str):
        self.line = line
        self.message = message


class Fixit:
    def __init__(self, description: str, start_line: int, start_column: int,
                 end_line: int, end_column: int, replacement: str):
        self.description = description
        self.start_line = start_line
        self.start_column = start_column
        self.end_line = end_line
        self.end_column = end_column
        self.replacement = replacement


class CodeSuggestion:
    def __init__(self, line: int, message: str, fixes: List[Fixit]):
        self.line = line
        self.message = message
        self.fixes = fixes


gate_name_map = {
    'h': 'H',
    'x': 'X',
    'y': 'Y',
    'z': 'Z',
    's': 'S',
    't': 'T',
    'rx': 'RX',
    'ry': 'RY',
    'rz': 'RZ',
    'cx': 'CNOT',
    'cnot': 'CNOT',
    'cz': 'CZ',
    'swap': 'SWAP'
}


def validate_quantum_code(code: str) -> List[CodeError]:
    """Validate quantum code"""
    errors = []
    if not code.strip():
        return errors

    lines = code.split('\n')
    is_json = code.strip().startswith('{')
    looks_python = re.search(r'QuantumCircuit|cirq\.|circuit\.|qc\.|measure', code)
    looks_qasm = re.match(r'^OPENQASM\s+2\.0;', code.strip()) or re.search(r'\bqreg\s+q\[\d+\]', code)

    if not is_json and not looks_python and not looks_qasm:
        errors.append(CodeError(1, 'Unrecognized format. Use JSON, Qiskit, Cirq, or OpenQASM 2.0.'))

    # Try JSON parse if JSON
    if is_json:
        try:
            parsed = json.loads(code)
            if not isinstance(parsed.get('numQubits'), int) or not isinstance(parsed.get('gates'), list):
                errors.append(CodeError(1, 'JSON must have numQubits:number and gates:[]'))
        except json.JSONDecodeError:
            errors.append(CodeError(1, 'Invalid JSON syntax'))
    elif not looks_qasm:
        # Light-weight Python scan
        for i, line in enumerate(lines):
            if re.search(r'qc\.[a-zA-Z]+\(', line) or re.search(r'circuit\.append\(', line):
                if not re.search(r'\)\s*$', line.strip()):
                    errors.append(CodeError(i + 1, 'Missing closing parenthesis'))

        # Simple bracket balance check
        open_count = 0
        for i, line in enumerate(lines):
            for char in line:
                if char == '(':
                    open_count += 1
                elif char == ')':
                    open_count -= 1
            if open_count < 0:
                errors.append(CodeError(i + 1, 'Unexpected closing parenthesis'))
                open_count = 0
        if open_count > 0:
            errors.append(CodeError(len(lines), 'Unclosed parenthesis detected'))

    return errors


def parse_quantum_code(code: str) -> QuantumCircuit:
    """Parse quantum code into QuantumCircuit"""
    trimmed = code.strip()
    if not trimmed:
        return QuantumCircuit(num_qubits=1, gates=[])

    # OpenQASM support
    if re.match(r'^OPENQASM\s+2\.0;', trimmed) or re.search(r'\bqreg\s+q\[\d+\]', trimmed):
        qc = parse_open_qasm(trimmed)
        if qc:
            return qc

    if trimmed.startswith('{'):
        # JSON format
        obj = json.loads(trimmed)
        return QuantumCircuit(num_qubits=obj['numQubits'], gates=obj['gates'])

    # Try Qiskit first
    if re.search(r'QuantumCircuit|qc\.', code):
        return parse_qiskit(code)

    # Try Cirq
    if re.search(r'cirq\.|circuit\.', code):
        return parse_cirq(code)

    # Fallback empty
    return QuantumCircuit(num_qubits=1, gates=[])


def parse_qiskit(code: str) -> QuantumCircuit:
    """Parse Qiskit code"""
    # Detect number of qubits
    reg_match = re.search(r'QuantumRegister\((\d+)', code)
    circ_match = re.search(r'QuantumCircuit\((\d+)', code)

    num_qubits = 0
    if reg_match:
        num_qubits = max(num_qubits, int(reg_match.group(1)))
    if circ_match:
        num_qubits = max(num_qubits, int(circ_match.group(1)))
    if num_qubits == 0:
        # Try measure_all or default to 2
        range_match = re.search(r'range\((\d+)\)', code)
        num_qubits = int(range_match.group(1)) if range_match else 2

    gates = []
    lines = code.split('\n')

    for line in lines:
        line = line.strip()
        # qc.h(0)
        call_match = re.search(r'qc\.(\w+)\(([^)]*)\)', line)
        if call_match:
            name_raw = call_match.group(1).lower()
            mapped = gate_name_map.get(name_raw)
            if not mapped:
                continue

            args_str = call_match.group(2)
            args = [int(x.strip().replace('[^0-9]', '')) for x in args_str.split(',') if x.strip()]
            args = [x for x in args if not isinstance(x, str) or x.isdigit()]

            if args:
                qubits = args[:2] if mapped in ['CNOT', 'CZ', 'SWAP'] else args[:1]
                gates.append(QuantumGate(name=mapped, qubits=qubits))

    return QuantumCircuit(num_qubits=num_qubits, gates=gates)


def parse_cirq(code: str) -> QuantumCircuit:
    """Parse Cirq code"""
    # Map qubit identifiers
    num_qubits = 0
    range_match = re.search(r'LineQubit\.range\((\d+)\)', code)
    if range_match:
        num_qubits = int(range_match.group(1))
    if num_qubits == 0:
        num_qubits = 2

    var_to_index = {}
    var_decl_match = re.search(r'([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*))*\s*=\s*cirq\.LineQubit\.range\((\d+)\)', code)
    if var_decl_match:
        names_part = var_decl_match.group(0).split('=')[0]
        names = [s.strip() for s in names_part.split(',') if s.strip()]
        for idx, name in enumerate(names):
            var_to_index[name] = idx

    gates = []
    lines = code.split('\n')

    for line in lines:
        line = line.strip()
        # circuit.append(cirq.H(q0)) or circuit.append(cirq.CNOT(q0, q1))
        call_match = re.search(r'circuit\.append\(cirq\.(\w+)\(([^)]*)\)\)', line)
        if call_match:
            name_raw = call_match.group(1).lower()
            mapped = gate_name_map.get(name_raw)
            if not mapped:
                continue

            args_str = call_match.group(2)
            args = []
            for arg in args_str.split(','):
                arg = arg.strip()
                if arg in var_to_index:
                    args.append(var_to_index[arg])
                else:
                    # Try to parse as integer
                    try:
                        args.append(int(re.sub(r'[^0-9]', '', arg)))
                    except ValueError:
                        continue

            if args:
                qubits = args[:2] if mapped in ['CNOT', 'CZ', 'SWAP'] else args[:1]
                gates.append(QuantumGate(name=mapped, qubits=qubits))

    return QuantumCircuit(num_qubits=num_qubits, gates=gates)


def parse_open_qasm(text: str) -> Optional[QuantumCircuit]:
    """Parse OpenQASM 2.0 code"""
    try:
        qreg_match = re.search(r'qreg\s+q\[(\d+)\]', text)
        num_q = int(qreg_match.group(1)) if qreg_match else 1

        lines = text.split('\n')
        gates = []

        for line in lines:
            line = line.strip().lower()

            # Single qubit gates
            single_gate_match = re.match(r'^(h|x|y|z|s|t)\s+q\[(\d+)\];', line)
            if single_gate_match:
                gate_name = single_gate_match.group(1).upper()
                qubit = int(single_gate_match.group(2))
                gates.append(QuantumGate(name=gate_name, qubits=[qubit]))
                continue

            # Parameterized single qubit gates
            param_gate_match = re.match(r'^(rx|ry|rz)\(([^)]+)\)\s+q\[(\d+)\];', line)
            if param_gate_match:
                gate_name = param_gate_match.group(1).upper()
                qubit = int(param_gate_match.group(3))
                gates.append(QuantumGate(name=gate_name, qubits=[qubit]))
                continue

            # Two qubit gates
            two_gate_match = re.match(r'^(cx|cz|swap)\s+q\[(\d+)\],\s*q\[(\d+)\];', line)
            if two_gate_match:
                gate_name = two_gate_match.group(1).upper()
                if gate_name == 'CX':
                    gate_name = 'CNOT'
                qubit1 = int(two_gate_match.group(2))
                qubit2 = int(two_gate_match.group(3))
                gates.append(QuantumGate(name=gate_name, qubits=[qubit1, qubit2]))

        return QuantumCircuit(num_qubits=num_q, gates=gates)

    except Exception:
        return None


def simulate_circuit_wrapper(circuit: QuantumCircuit) -> Dict[str, Any]:
    """Wrapper for simulate_circuit"""
    return simulate_circuit(circuit)


# Example circuits (imported from circuit_operations)
try:
    # Try relative imports first (when imported as module)
    from .circuit_operations import EXAMPLE_CIRCUITS
except ImportError:
    # Fall back to absolute imports (when run directly)
    from circuit_operations import EXAMPLE_CIRCUITS


def suggest_fixes(code: str) -> List[CodeSuggestion]:
    """Provide intelligent suggestions and fix-its"""
    suggestions = []
    if not code.strip():
        return suggestions

    lines = code.split('\n')
    is_json = code.strip().startswith('{')

    # Known canonical gate names
    known_gates = list(gate_name_map.values())

    # Utility: Levenshtein distance
    def levenshtein_distance(a: str, b: str) -> int:
        dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
        for i in range(len(a) + 1):
            dp[i][0] = i
        for j in range(len(b) + 1):
            dp[0][j] = j
        for i in range(1, len(a) + 1):
            for j in range(1, len(b) + 1):
                cost = 0 if a[i-1] == b[j-1] else 1
                dp[i][j] = min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost)
        return dp[len(a)][len(b)]

    # Try to infer numQubits from parsed circuit
    inferred_qubits = 0
    try:
        inferred_qubits = parse_quantum_code(code).num_qubits
    except:
        pass

    if is_json:
        try:
            obj = json.loads(code)
            if isinstance(obj.get('gates'), list):
                for gate in obj['gates']:
                    if isinstance(gate.get('name'), str) and gate['name'] not in known_gates:
                        best = min([(k, levenshtein_distance(gate['name'].upper(), k)) for k in known_gates],
                                 key=lambda x: x[1])
                        if best[1] <= 3:
                            # Find line with this gate
                            for i, line in enumerate(lines):
                                if f'"{gate["name"]}"' in line:
                                    suggestions.append(CodeSuggestion(
                                        line=i + 1,
                                        message=f'Did you mean {best[0]}?',
                                        fixes=[Fixit(
                                            description=f'Replace gate name with {best[0]}',
                                            start_line=i + 1,
                                            start_column=1,
                                            end_line=i + 1,
                                            end_column=len(line),
                                            replacement=line.replace(gate['name'], best[0])
                                        )]
                                    ))
                                    break

                    if isinstance(gate.get('qubits'), list) and inferred_qubits > 0:
                        for q in gate['qubits']:
                            if not isinstance(q, int) or q < 0 or q >= inferred_qubits:
                                for i, line in enumerate(lines):
                                    if str(q) in line and '"qubits"' in line:
                                        suggestions.append(CodeSuggestion(
                                            line=i + 1,
                                            message=f'Qubit index exceeds available qubits. Try using 0..{inferred_qubits - 1}.',
                                            fixes=[]
                                        ))
                                        break
        except:
            pass

    # Python/Qiskit/Cirq suggestions
    has_qiskit_import = 'from qiskit import QuantumCircuit' in code or 'import qiskit' in code
    has_cirq_import = 'import cirq' in code

    if re.search(r'QuantumCircuit|qc\.', code) and not has_qiskit_import:
        suggestions.append(CodeSuggestion(
            line=1,
            message='Missing Qiskit import. Try adding: from qiskit import QuantumCircuit',
            fixes=[Fixit(
                description='Add Qiskit import',
                start_line=1,
                start_column=1,
                end_line=1,
                end_column=1,
                replacement='from qiskit import QuantumCircuit\n' + lines[0] if lines else ''
            )]
        ))

    if re.search(r'cirq\.|circuit\.', code) and not has_cirq_import:
        suggestions.append(CodeSuggestion(
            line=1,
            message='Missing Cirq import. Try adding: import cirq',
            fixes=[Fixit(
                description='Add Cirq import',
                start_line=1,
                start_column=1,
                end_line=1,
                end_column=1,
                replacement='import cirq\n' + lines[0] if lines else ''
            )]
        ))

    # Gate typos and paren fixes
    for i, line in enumerate(lines):
        q_call = re.search(r'qc\.(\w+)\(([^)]*)', line)
        if q_call:
            name_raw = q_call.group(1)
            mapped = gate_name_map.get(name_raw.lower())
            if not mapped:
                best = min([(k, levenshtein_distance(name_raw.upper(), k)) for k in known_gates],
                         key=lambda x: x[1])
                if best[1] <= 3:
                    start = line.find('qc.') + 3
                    suggestions.append(CodeSuggestion(
                        line=i + 1,
                        message=f'Did you mean {best[0]}?',
                        fixes=[Fixit(
                            description=f'Replace {name_raw} with {best[0].lower()}',
                            start_line=i + 1,
                            start_column=start,
                            end_line=i + 1,
                            end_column=start + len(name_raw),
                            replacement=best[0].lower()
                        )]
                    ))

            if not line.strip().endswith(')'):
                suggestions.append(CodeSuggestion(
                    line=i + 1,
                    message='Missing closing parenthesis.',
                    fixes=[Fixit(
                        description='Add ")"',
                        start_line=i + 1,
                        start_column=len(line) + 1,
                        end_line=i + 1,
                        end_column=len(line) + 1,
                        replacement=')'
                    )]
                ))

            if inferred_qubits > 0:
                args = [int(re.sub(r'[^0-9]', '', s)) for s in q_call.group(2).split(',') if s.strip()]
                args = [x for x in args if isinstance(x, int)]
                for q in args:
                    if q < 0 or q >= inferred_qubits:
                        suggestions.append(CodeSuggestion(
                            line=i + 1,
                            message=f'Qubit index exceeds available qubits. Try using 0..{inferred_qubits - 1}.',
                            fixes=[]
                        ))

        c_call = re.search(r'circuit\.append\(cirq\.(\w+)\(([^)]*)', line)
        if c_call:
            name_raw = c_call.group(1)
            mapped = gate_name_map.get(name_raw.lower())
            if not mapped:
                best = min([(k, levenshtein_distance(name_raw.upper(), k)) for k in known_gates],
                         key=lambda x: x[1])
                if best[1] <= 3:
                    start = line.find('cirq.') + 5
                    suggestions.append(CodeSuggestion(
                        line=i + 1,
                        message=f'Did you mean {best[0]}?',
                        fixes=[Fixit(
                            description=f'Replace {name_raw} with {best[0]}',
                            start_line=i + 1,
                            start_column=start,
                            end_line=i + 1,
                            end_column=start + len(name_raw),
                            replacement=best[0]
                        )]
                    ))

            if not line.strip().endswith('))'):
                suggestions.append(CodeSuggestion(
                    line=i + 1,
                    message='Missing closing "))".',
                    fixes=[Fixit(
                        description='Add "))"',
                        start_line=i + 1,
                        start_column=len(line) + 1,
                        end_line=i + 1,
                        end_column=len(line) + 1,
                        replacement='))'
                    )]
                ))

    return suggestions