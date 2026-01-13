# IBM Quantum Platform - Complete API Reference Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication & Setup](#authentication--setup)
3. [REST API Reference](#rest-api-reference)
4. [Qiskit SDK API](#qiskit-sdk-api)
5. [Circuit Construction](#circuit-construction)
6. [Quantum Gates](#quantum-gates)
7. [Job Submission & Management](#job-submission--management)
8. [Sessions](#sessions)
9. [Error Mitigation](#error-mitigation)
10. [Code Examples](#code-examples)

---

## Overview

IBM Quantum Platform provides access to quantum processing units (QPUs) through:
- **REST API**: Language-agnostic HTTP-based access
- **Qiskit SDK**: Python-based quantum computing framework
- **Qiskit Runtime**: Optimized execution with error mitigation

### Key Components
- **Primitives**: Simplified interfaces (Sampler, Estimator) for circuit execution
- **Backends**: Quantum computers and simulators available for execution
- **Sessions**: Grouped job execution for iterative algorithms
- **Transpiler**: Circuit optimization for specific hardware

---

## Authentication & Setup

### 1. Get API Key
1. Sign up at https://quantum.cloud.ibm.com
2. Access your dashboard to get your API key (44-character token)
3. Note your Instance CRN (Cloud Resource Name)

### 2. Generate Bearer Token

The API requires an IBM Cloud IAM bearer token for authentication. Bearer tokens expire after 1 hour.

**cURL:**
```bash
curl -X POST 'https://iam.cloud.ibm.com/identity/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=YOUR_API_KEY'
```

**Python:**
```python
import requests

response = requests.post(
    'https://iam.cloud.ibm.com/identity/token',
    headers={'Content-Type': 'application/x-www-form-urlencoded'},
    data='grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=YOUR_API_KEY'
)

token_data = response.json()
bearer_token = token_data['access_token']
expires_in = token_data['expires_in']  # Time in seconds (typically 3600)
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUz......sgrKIi8hdFs",
  "refresh_token": "not_supported",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expiration": 1473188353,
  "scope": "ibm_openid"
}
```

### 3. Environment Setup

**Environment Variables:**
```bash
export IQP_API_TOKEN=<your-44-character-API-key>
export IQP_BEARER_TOKEN=<your-bearer-token>
export IQP_INSTANCE_CRN=<your-instance-crn>
```

**Python:**
```python
import os

api_token = os.environ['IQP_API_TOKEN']
bearer_token = os.environ['IQP_BEARER_TOKEN']
instance_crn = os.environ['IQP_INSTANCE_CRN']
```

### 4. Region Configuration

**US Region (Default):**
- Base URL: `https://quantum.cloud.ibm.com/api/v1/`

**EU Region (Frankfurt):**
- Base URL: `https://eu-de.quantum.cloud.ibm.com/api/v1/`

---

## REST API Reference

### Base Configuration

**Required Headers:**
```
Authorization: Bearer <YOUR_BEARER_TOKEN>
Service-CRN: <YOUR_INSTANCE_CRN>
IBM-API-Version: 2025-05-01
Accept: application/json
Content-Type: application/json
```

### API Endpoints

#### 1. Versions
- **GET** `/versions` - Get API versions

#### 2. Backends

**List Available Backends:**
```bash
curl -X GET 'https://quantum.cloud.ibm.com/api/v1/backends' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer <BEARER_TOKEN>' \
  -H 'Service-CRN: <INSTANCE_CRN>' \
  -H 'IBM-API-Version: 2025-05-01'
```

```python
import requests

reqUrl = "https://quantum.cloud.ibm.com/api/v1/backends"
headersList = {
    "Accept": "application/json",
    "Authorization": "Bearer <BEARER_TOKEN>",
    "Service-CRN": "<INSTANCE_CRN>",
    "IBM-API-Version": "2025-05-01"
}

response = requests.get(reqUrl, headers=headersList)
backends = response.json()
```

**Backend Endpoints:**
- **GET** `/backends` - List available backends
- **GET** `/backends/{backend}/configuration` - Get backend configuration
- **GET** `/backends/{backend}/defaults` - Get backend default settings
- **GET** `/backends/{backend}/properties` - Get backend properties (noise, error rates)
- **GET** `/backends/{backend}/status` - Get backend status (operational, queue depth)

#### 3. Jobs

**Submit a Job (Estimator Example):**

```bash
curl -X POST 'https://quantum.cloud.ibm.com/api/v1/jobs' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer <BEARER_TOKEN>' \
  -H 'Service-CRN: <INSTANCE_CRN>' \
  -H 'IBM-API-Version: 2025-05-01' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "program_id": "estimator",
    "backend": "ibm_brisbane",
    "params": {
      "pubs": [[
        "OPENQASM 3.0; include \"stdgates.inc\"; bit[1] c; x $0; c[0] = measure $0;",
        "Z"
      ]],
      "options": {
        "dynamical_decoupling": {"enable": true}
      },
      "version": 2,
      "resilience_level": 1
    }
  }'
```

```python
import requests
import json

reqUrl = "https://quantum.cloud.ibm.com/api/v1/jobs"
headersList = {
    "Accept": "application/json",
    "Authorization": "Bearer <BEARER_TOKEN>",
    "Service-CRN": "<INSTANCE_CRN>",
    "IBM-API-Version": "2025-05-01",
    "Content-Type": "application/json"
}

payload = json.dumps({
    "program_id": "estimator",  # or "sampler"
    "backend": "ibm_brisbane",
    "params": {
        "pubs": [[
            "OPENQASM 3.0; include \"stdgates.inc\"; bit[1] c; x $0; c[0] = measure $0;",
            "Z"
        ]],
        "options": {"dynamical_decoupling": {"enable": True}},
        "version": 2,
        "resilience_level": 1
    }
})

response = requests.post(reqUrl, data=payload, headers=headersList)
job_data = response.json()
job_id = job_data['id']
```

**Job Management Endpoints:**
- **POST** `/jobs` - Create/submit a job
- **GET** `/jobs` - List all jobs
- **GET** `/jobs/{job_id}` - Get job details
- **DELETE** `/jobs/{job_id}` - Delete a job
- **POST** `/jobs/{job_id}/cancel` - Cancel a running job
- **GET** `/jobs/{job_id}/interim_results` - Get interim results
- **GET** `/jobs/{job_id}/logs` - Get job logs
- **GET** `/jobs/{job_id}/metrics` - Get job metrics
- **GET** `/jobs/{job_id}/results` - Get job results
- **PUT** `/jobs/{job_id}/tags` - Replace job tags
- **GET** `/jobs/{job_id}/transpiled_circuits` - Get transpiled circuits

**Job Parameters:**
- `program_id`: "sampler" or "estimator"
- `backend`: Backend name (e.g., "ibm_brisbane", "ibm_kyoto")
- `params.pubs`: Array of circuits (OpenQASM strings) and observables
- `params.version`: Primitive version (use 2 for V2 primitives)
- `params.resilience_level`: 0-3 (error mitigation level)
- `params.options`: Execution options (dynamical decoupling, optimization, etc.)

#### 4. Sessions

Sessions enable grouped job execution with reduced queue wait times.

**Create Session:**
```python
import requests
import json

reqUrl = "https://quantum.cloud.ibm.com/api/v1/sessions"
headersList = {
    "Accept": "application/json",
    "Authorization": "Bearer <BEARER_TOKEN>",
    "Service-CRN": "<INSTANCE_CRN>",
    "IBM-API-Version": "2025-05-01",
    "Content-Type": "application/json"
}

payload = json.dumps({
    "mode": "dedicated",  # or "batch"
    "max_ttl": 28800  # Max time-to-live in seconds (8 hours)
})

response = requests.post(reqUrl, data=payload, headers=headersList)
session_data = response.json()
session_id = session_data['id']
```

**Submit Job to Session:**
```python
payload = json.dumps({
    "program_id": "sampler",
    "backend": "ibm_brisbane",
    "session_id": session_id,  # Add session_id
    "params": {
        "pubs": [[
            "OPENQASM 3.0; include \"stdgates.inc\"; bit[1] c; x $0; c[0] = measure $0;"
        ]],
        "options": {},
        "version": 2
    }
})
```

**Session Endpoints:**
- **POST** `/sessions` - Create a session
- **GET** `/sessions/{session_id}` - Get session details
- **PATCH** `/sessions/{session_id}` - Update session
- **DELETE** `/sessions/{session_id}/close` - Close session

#### 5. Instances & Usage

- **GET** `/instance` - Get current instance details
- **GET** `/instance/configuration` - Get instance configuration
- **PUT** `/instance/configuration` - Update instance configuration
- **GET** `/usage` - Get instance usage data

#### 6. Analytics

- **GET** `/analytics/filters` - Get available analytics filters
- **GET** `/analytics/usage` - Get usage analytics
- **GET** `/analytics/usage/grouped` - Get grouped usage analytics
- **GET** `/analytics/usage/grouped_by_date` - Get usage by date

#### 7. Additional Endpoints

- **GET** `/tags` - List all tags
- **GET** `/account` - Get account configuration
- **GET** `/workloads` - List user workloads

---

## Qiskit SDK API

### Installation

```bash
pip install qiskit
pip install qiskit-ibm-runtime
```

### Basic Setup

```python
from qiskit import QuantumCircuit
from qiskit_ibm_runtime import QiskitRuntimeService

# Save account (one-time setup)
QiskitRuntimeService.save_account(
    channel="ibm_quantum",
    token="YOUR_API_KEY",
    overwrite=True
)

# Load service
service = QiskitRuntimeService()

# List available backends
backends = service.backends()
for backend in backends:
    print(f"{backend.name}: {backend.status().pending_jobs} jobs queued")
```

### Key Modules

#### 1. Circuit Construction (`qiskit.circuit`)

**QuantumCircuit Class:**
```python
from qiskit import QuantumCircuit

# Create circuit with 3 qubits and 3 classical bits
qc = QuantumCircuit(3, 3)

# Add gates
qc.h(0)           # Hadamard gate on qubit 0
qc.cx(0, 1)       # CNOT gate (control: 0, target: 1)
qc.cx(1, 2)       # CNOT gate (control: 1, target: 2)

# Add measurement
qc.measure([0, 1, 2], [0, 1, 2])

# Visualize
print(qc.draw())
```

**Registers:**
```python
from qiskit import QuantumRegister, ClassicalRegister, QuantumCircuit

# Create registers
qr = QuantumRegister(5, 'q')
cr = ClassicalRegister(5, 'c')

# Create circuit with registers
qc = QuantumCircuit(qr, cr)
```

#### 2. Circuit Library (`qiskit.circuit.library`)

**Standard Gates:**
```python
from qiskit.circuit.library import (
    XGate, YGate, ZGate,      # Pauli gates
    HGate,                     # Hadamard
    SGate, TGate,              # Phase gates
    CXGate, CYGate, CZGate,    # Controlled gates
    RXGate, RYGate, RZGate,    # Rotation gates
    SwapGate,                  # Swap gate
    CCXGate                    # Toffoli (CCX)
)

# Create gates
x_gate = XGate()
cx_gate = CXGate()
rx_gate = RXGate(theta=1.5708)  # π/2 rotation

# Apply to circuit
qc = QuantumCircuit(2)
qc.append(cx_gate, [0, 1])
```

**Multi-Controlled Gates:**
```python
from qiskit.circuit.library import MCXGate

# 4-control X gate
mcx = MCXGate(4)

qc = QuantumCircuit(5)
qc.append(mcx, [0, 1, 4, 2, 3])  # controls: [0,1,4,2], target: 3
```

**Custom Gates:**
```python
from qiskit.circuit.library import UnitaryGate
import numpy as np

# Define unitary matrix
matrix = np.array([[0, 0, 0, 1],
                   [0, 0, 1, 0],
                   [1, 0, 0, 0],
                   [0, 1, 0, 0]])

# Create gate
custom_gate = UnitaryGate(matrix)

# Apply to circuit
qc = QuantumCircuit(2)
qc.append(custom_gate, [0, 1])
```

#### 3. Quantum Information (`qiskit.quantum_info`)

```python
from qiskit.quantum_info import Operator, Statevector

# Get operator from circuit
op = Operator(qc)
print(op.data)  # Matrix representation

# Simulate statevector
sv = Statevector.from_instruction(qc)
print(sv)
```

#### 4. Transpilation (`qiskit.transpiler`)

```python
from qiskit import transpile

# Transpile for specific backend
backend = service.backend('ibm_brisbane')
transpiled_qc = transpile(qc, backend=backend, optimization_level=3)

print(f"Original depth: {qc.depth()}")
print(f"Transpiled depth: {transpiled_qc.depth()}")
```

**Transpiler Options:**
- `optimization_level`: 0-3 (higher = more optimization)
- `seed_transpiler`: Random seed for reproducibility
- `scheduling_method`: 'alap' or 'asap'
- `layout_method`: Initial qubit mapping strategy
- `routing_method`: SWAP insertion strategy

#### 5. Primitives (`qiskit_ibm_runtime`)

**Sampler (get measurement outcomes):**
```python
from qiskit_ibm_runtime import SamplerV2 as Sampler

# Initialize
sampler = Sampler(backend=backend)

# Run circuit
job = sampler.run([qc], shots=1000)
result = job.result()

# Get counts
pub_result = result[0]
counts = pub_result.data.c.get_counts()
print(counts)
```

**Estimator (calculate expectation values):**
```python
from qiskit_ibm_runtime import EstimatorV2 as Estimator
from qiskit.quantum_info import SparsePauliOp

# Define observable
observable = SparsePauliOp("ZZ")

# Initialize
estimator = Estimator(backend=backend)

# Run
job = estimator.run([(qc, observable)], shots=1000)
result = job.result()

# Get expectation value
pub_result = result[0]
expectation_value = pub_result.data.evs
print(f"Expectation value: {expectation_value}")
```

**Runtime Options:**
```python
from qiskit_ibm_runtime import Options

options = Options()
options.optimization_level = 3
options.resilience_level = 1
options.dynamical_decoupling.enable = True
options.execution.shots = 4000

sampler = Sampler(backend=backend, options=options)
```

#### 6. Visualization (`qiskit.visualization`)

```python
from qiskit.visualization import (
    plot_histogram,
    plot_bloch_multivector,
    circuit_drawer
)

# Draw circuit
qc.draw('mpl')  # Matplotlib
qc.draw('text')  # ASCII
qc.draw('latex')  # LaTeX

# Plot results
plot_histogram(counts)

# Plot state
from qiskit.quantum_info import Statevector
state = Statevector.from_instruction(qc)
plot_bloch_multivector(state)
```

---

## Circuit Construction

### OpenQASM Format

IBM Quantum uses OpenQASM 3.0 for circuit representation.

**Basic Structure:**
```qasm
OPENQASM 3.0;
include "stdgates.inc";

// Declare qubits and classical bits
qubit[2] q;
bit[2] c;

// Apply gates
h q[0];
cx q[0], q[1];

// Measure
c[0] = measure q[0];
c[1] = measure q[1];
```

**From Python:**
```python
from qiskit import qasm3

# Create circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

# Export to OpenQASM 3
qasm_str = qasm3.dumps(qc)
print(qasm_str)
```

### Circuit Composition

```python
# Create sub-circuits
qc1 = QuantumCircuit(2)
qc1.h(0)
qc1.cx(0, 1)

qc2 = QuantumCircuit(2)
qc2.x(0)
qc2.y(1)

# Compose circuits
main_circuit = QuantumCircuit(2)
main_circuit.compose(qc1, inplace=True)
main_circuit.barrier()
main_circuit.compose(qc2, inplace=True)
```

### Parameterized Circuits

```python
from qiskit.circuit import Parameter

# Define parameters
theta = Parameter('θ')
phi = Parameter('φ')

# Create parameterized circuit
qc = QuantumCircuit(1)
qc.rx(theta, 0)
qc.rz(phi, 0)

# Bind parameters
bound_circuit = qc.assign_parameters({theta: 1.5708, phi: 3.1416})
```

---

## Quantum Gates

### Single-Qubit Gates

| Gate | Matrix | Description |
|------|--------|-------------|
| **I** (Identity) | [[1,0],[0,1]] | No operation |
| **X** (NOT) | [[0,1],[1,0]] | Bit flip |
| **Y** | [[0,-i],[i,0]] | Y-axis rotation |
| **Z** | [[1,0],[0,-1]] | Phase flip |
| **H** (Hadamard) | (1/√2)[[1,1],[1,-1]] | Superposition |
| **S** | [[1,0],[0,i]] | Phase gate (Z^½) |
| **T** | [[1,0],[0,e^(iπ/4)]] | π/8 gate (S^½) |
| **RX(θ)** | Rotation about X-axis | Parameterized |
| **RY(θ)** | Rotation about Y-axis | Parameterized |
| **RZ(θ)** | Rotation about Z-axis | Parameterized |

**Usage:**
```python
qc = QuantumCircuit(1)
qc.x(0)      # X gate
qc.h(0)      # Hadamard
qc.s(0)      # S gate
qc.t(0)      # T gate
qc.rx(1.57, 0)  # RX(π/2)
```

### Two-Qubit Gates

| Gate | Description |
|------|-------------|
| **CX** (CNOT) | Controlled-X (controlled-NOT) |
| **CY** | Controlled-Y |
| **CZ** | Controlled-Z |
| **CH** | Controlled-Hadamard |
| **SWAP** | Swap two qubits |
| **CRX/CRY/CRZ** | Controlled rotations |

**Usage:**
```python
qc = QuantumCircuit(2)
qc.cx(0, 1)     # CNOT: control=0, target=1
qc.cz(0, 1)     # CZ
qc.swap(0, 1)   # SWAP
qc.crx(1.57, 0, 1)  # Controlled RX
```

### Three-Qubit Gates

| Gate | Description |
|------|-------------|
| **CCX** (Toffoli) | Double-controlled X |
| **CSWAP** (Fredkin) | Controlled SWAP |

**Usage:**
```python
qc = QuantumCircuit(3)
qc.ccx(0, 1, 2)  # Toffoli: controls=[0,1], target=2
qc.cswap(0, 1, 2)  # Fredkin: control=0, swap=[1,2]
```

### Advanced Gate Operations

**Power:**
```python
from qiskit.circuit.library import XGate

gate = XGate()
sqrt_x = gate.power(0.5)  # Square root of X
```

**Control:**
```python
from qiskit.circuit.library import HGate

h_gate = HGate()
ch_gate = h_gate.control(1)  # Controlled-H
cch_gate = h_gate.control(2)  # Double-controlled-H
```

**Inverse:**
```python
cx_gate = CXGate()
cx_inv = cx_gate.inverse()  # Inverse (same as CX)
```

---

## Job Submission & Management

### Job Lifecycle

1. **Create** - Submit job to backend
2. **Queued** - Job waiting in queue
3. **Running** - Job executing on QPU
4. **Completed** - Results available
5. **Failed/Cancelled** - Error or cancellation

### Monitoring Jobs

**Python SDK:**
```python
from qiskit_ibm_runtime import Sampler

sampler = Sampler(backend=backend)
job = sampler.run([qc], shots=1000)

# Get job ID
print(f"Job ID: {job.job_id()}")

# Check status
print(f"Status: {job.status()}")

# Wait for completion
result = job.result()

# Retrieve later
retrieved_job = service.job(job_id)
result = retrieved_job.result()
```

**REST API:**
```python
# Get job status
response = requests.get(
    f"https://quantum.cloud.ibm.com/api/v1/jobs/{job_id}",
    headers=headersList
)
job_info = response.json()
print(f"Status: {job_info['status']}")

# Get results
response = requests.get(
    f"https://quantum.cloud.ibm.com/api/v1/jobs/{job_id}/results",
    headers=headersList
)
results = response.json()

# Cancel job
requests.post(
    f"https://quantum.cloud.ibm.com/api/v1/jobs/{job_id}/cancel",
    headers=headersList
)
```

---

## Sessions

Sessions group multiple jobs together, reducing queue wait times for iterative algorithms.

### Session Modes

1. **Dedicated Mode**: Reserved time slot on backend
2. **Batch Mode**: Jobs run together but may be interleaved

### Using Sessions (Python SDK)

```python
from qiskit_ibm_runtime import Session, Sampler

# Create session
with Session(backend=backend) as session:
    sampler = Sampler(session=session)
    
    # Run multiple jobs in session
    for i in range(10):
        qc = create_circuit(i)
        job = sampler.run([qc])
        result = job.result()
        print(f"Iteration {i}: {result}")
```

### Session Configuration

```python
from qiskit_ibm_runtime import Session

session = Session(
    backend=backend,
    max_time='8h'  # Maximum session duration
)
```

---

## Error Mitigation

IBM Quantum provides built-in error mitigation techniques.

### Resilience Levels

- **Level 0**: No error mitigation (fastest)
- **Level 1**: Basic error mitigation
- **Level 2**: Advanced error mitigation
- **Level 3**: Maximum error mitigation (slowest)

### Options

**Dynamical Decoupling:**
Inserts additional gates to protect against decoherence.

```python
options = Options()
options.dynamical_decoupling.enable = True
options.dynamical_decoupling.sequence_type = 'XY4'  # or 'XX'
```

**Twirling:**
Randomizes noise to convert coherent errors into stochastic errors.

```python
options.twirling.enable_gates = True
options.twirling.enable_measure = True
options.twirling.num_randomizations = 300
```

**Zero Noise Extrapolation (ZNE):**
```python
options.resilience_level = 2  # Enables TREX + ZNE
options.resilience.zne_mitigation = True
options.resilience.zne.amplifier = 'gate_folding'
```

**Complete Example:**
```python
from qiskit_ibm_runtime import Estimator, Options

options = Options()
options.resilience_level = 2
options.optimization_level = 3
options.dynamical_decoupling.enable = True
options.execution.shots = 4000

estimator = Estimator(backend=backend, options=options)
job = estimator.run([(qc, observable)])
result = job.result()
```

---

## Code Examples

### Example 1: Bell State

```python
from qiskit import QuantumCircuit
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler

# Create Bell state
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

# Setup and run
service = QiskitRuntimeService()
backend = service.backend('ibm_brisbane')
sampler = Sampler(backend=backend)

job = sampler.run([qc], shots=1000)
result = job.result()
counts = result[0].data.meas.get_counts()

print(counts)
# Expected: {'00': ~500, '11': ~500}
```

### Example 2: GHZ State

```python
# 3-qubit GHZ state
qc = QuantumCircuit(3, 3)
qc.h(0)
qc.cx(0, 1)
qc.cx(0, 2)
qc.measure_all()

sampler = Sampler(backend=backend)
job = sampler.run([qc], shots=1000)
result = job.result()
counts = result[0].data.meas.get_counts()

print(counts)
# Expected: {'000': ~500, '111': ~500}
```

### Example 3: Quantum Fourier Transform

```python
import numpy as np
from qiskit.circuit.library import QFT

# Create QFT circuit
n_qubits = 3
qc = QuantumCircuit(n_qubits)

# Apply QFT
qft = QFT(n_qubits)
qc.compose(qft, inplace=True)

# Measure
qc.measure_all()

# Run
sampler = Sampler(backend=backend)
job = sampler.run([qc], shots=1000)
result = job.result()
```

### Example 4: Variational Quantum Eigensolver (VQE) Setup

```python
from qiskit.circuit.library import TwoLocal
from qiskit.quantum_info import SparsePauliOp
from qiskit_ibm_runtime import Estimator, Session

# Define Hamiltonian
H = SparsePauliOp.from_list([
    ("ZZ", 1.0),
    ("XX", 0.5),
    ("YY", 0.5)
])

# Create ansatz
ansatz = TwoLocal(2, 'ry', 'cx', reps=3, entanglement='linear')

# Function to evaluate energy
def cost_function(params):
    bound_circuit = ansatz.assign_parameters(params)
    
    estimator = Estimator(backend=backend)
    job = estimator.run([(bound_circuit, H)])
    result = job.result()
    
    energy = result[0].data.evs
    return energy

# Use with classical optimizer
from scipy.optimize import minimize

initial_params = np.random.random(ansatz.num_parameters)
result = minimize(cost_function, initial_params, method='COBYLA')

print(f"Optimal energy: {result.fun}")
print(f"Optimal parameters: {result.x}")
```
