from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import asyncio
import time
import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import threading
from contextlib import asynccontextmanager

# Import our modules
from quantum_executor import execute_circuit_locally, execute_circuit_ibm, validate_circuit_data
from quantum_api import (
    QuantumAPI, BackendType, QuantumExecutionOptions,
    execute_quantum_circuit_sync, validate_token as api_validate_token,
    get_available_backends as api_get_backends,
    get_user_jobs as api_get_user_jobs
)
from quantum_knowledge_base import ask_ai_question
from quantum_worker import QuantumWorker, QuantumWorkerPool, simulate_circuit_async
from ts_sim_port import Circuit as TsCircuit, Gate as TsGate, simulate_circuit as simulate_circuit_ts
from quantum_ml_primitives import (
    FeatureMap, ZFeatureMap, ZZFeatureMap, AmplitudeEncoding,
    QuantumKernel, FidelityQuantumKernel, ProjectedQuantumKernel,
    QNNLayer, VariationalLayer, DataEncodingLayer, MeasurementLayer,
    VariationalQuantumClassifier, VQCConfig,
    generate_classification_dataset, generate_regression_dataset,
    evaluate_classification, evaluate_regression,
    serialize_model, deserialize_model
)
from quantum_data_preprocessing import (
    QuantumDataPreprocessor, DataSample,
    standardize_features, normalize_features, encode_for_quantum,
    reduce_dimensionality, create_train_validation_split,
    analyze_quantum_readiness
)
import kagglehub
from medical_core import medical_core, download_csv_from_drive

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Create FastAPI app
app = FastAPI(title="Quantum Backend API", version="1.0.0")

# ============================================================================
# CORS Configuration - FULLY OPEN (No Restrictions)
# ============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow ALL origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow ALL methods
    allow_headers=["*"],  # Allow ALL headers
    expose_headers=["*"],
)

# Security (optional, not enforced)
security = HTTPBearer(auto_error=False)

# Simple in-memory cache
class BackendCache:
    def __init__(self):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = 100
        self.default_ttl = 5 * 60 * 1000  # 5 minutes

    def generate_key(self, request: Request) -> str:
        return f"{request.method}_{request.url.path}_{json.dumps(dict(request.query_params))}_{json.dumps(request.state.body_data if hasattr(request.state, 'body_data') else {})}"

    def get(self, request: Request) -> Optional[Any]:
        key = self.generate_key(request)
        entry = self.cache.get(key)

        if not entry:
            return None

        if time.time() * 1000 > entry["expiry"]:
            del self.cache[key]
            return None

        return entry["data"]

    def set(self, request: Request, data: Any, ttl: Optional[int] = None) -> None:
        key = self.generate_key(request)

        if len(self.cache) >= self.max_size:
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]

        self.cache[key] = {
            "data": data,
            "expiry": time.time() * 1000 + (ttl or self.default_ttl),
            "timestamp": time.time() * 1000
        }

    def clear(self) -> None:
        self.cache.clear()

    def get_stats(self) -> Dict[str, Any]:
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "entries": [
                {
                    "key": key[:50] + "..." if len(key) > 50 else key,
                    "age": time.time() * 1000 - entry["timestamp"],
                    "ttl": entry["expiry"] - time.time() * 1000
                }
                for key, entry in self.cache.items()
            ]
        }

backend_cache = BackendCache()

# Cache middleware - DISABLED due to streaming response issues
# Caching is disabled to avoid issues with FastAPI streaming responses
# Re-enable after implementing proper response body reading
@app.middleware("http")
async def cache_middleware(request: Request, call_next):
    # Simply pass through all requests without caching
    response = await call_next(request)
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "quantum-backend",
        "cache": backend_cache.get_stats()
    }

# Cache management endpoints
@app.get("/api/cache/stats")
async def get_cache_stats():
    return {
        "success": True,
        "cache": backend_cache.get_stats()
    }

@app.delete("/api/cache/clear")
async def clear_cache():
    backend_cache.clear()
    print("Cache manually cleared via API")
    return {
        "success": True,
        "message": "Cache cleared successfully"
    }

# IBM Quantum authentication endpoint
@app.post("/api/quantum/auth")
async def authenticate_ibm_quantum(request: Request, data: Dict[str, Any]):
    try:
        token = data.get("token")
        backend = data.get("backend", "ibmq_qasm_simulator")

        if not token:
            raise HTTPException(status_code=400, detail="IBM Quantum token is required")

        # Validate token using unified API
        valid, error = await api_validate_token(token)

        if not valid:
            raise HTTPException(status_code=401, detail=error or "Invalid IBM Quantum token")

        # Get backend information
        backend_info = await get_backend_info(token, backend)

        return {
            "success": True,
            "backend": backend_info,
            "message": f"Connected to {backend_info['name']}"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Authentication error: {e}")
        raise HTTPException(status_code=500, detail="Failed to authenticate with IBM Quantum")

# Circuit execution endpoint
@app.post("/api/quantum/execute")
async def execute_circuit(request: Request, data: Dict[str, Any]):
    try:
        token = data.get("token")
        backend_name = data.get("backend", "local")
        circuit = data.get("circuit")
        initial_state = data.get("initialState", "ket0")
        custom_state = data.get("customState", {})
        shots = data.get("shots", 1024)

        # Validate required fields
        if not circuit:
            raise HTTPException(status_code=400, detail="Circuit is required")

        if not isinstance(circuit, dict) or "numQubits" not in circuit or "gates" not in circuit:
            raise HTTPException(status_code=400, detail="Invalid circuit format. Must have numQubits (number) and gates (array)")

        num_qubits = circuit["numQubits"]
        if not isinstance(num_qubits, int) or num_qubits < 1 or num_qubits > 10:
            raise HTTPException(status_code=400, detail="numQubits must be an integer between 1 and 10")

        if len(circuit["gates"]) > 100:
            raise HTTPException(status_code=400, detail="Too many gates. Maximum 100 gates allowed")

        if not isinstance(shots, int) or shots < 1 or shots > 10000:
            raise HTTPException(status_code=400, detail="shots must be an integer between 1 and 10000")

        # Map backend name to BackendType
        try:
            if backend_name == "local":
                backend = BackendType.LOCAL
            elif backend_name == "aer_simulator":
                backend = BackendType.AER_SIMULATOR
            elif backend_name == "custom_simulator":
                backend = BackendType.CUSTOM_SIMULATOR
            elif backend_name == "wasm":
                backend = BackendType.WASM
            elif "simulator" in backend_name:
                backend = BackendType.IBM_SIMULATOR
            elif backend_name.startswith("ibm") or backend_name.startswith("ibmq"):
                backend = BackendType.IBM_HARDWARE
            else:
                backend = BackendType(backend_name)  # Try direct mapping
        except ValueError:
            print(f"Backend mapping error: {backend_name}")
            raise HTTPException(status_code=400, detail=f"Unsupported backend: {backend_name}")

        # Token validation for non-local backends
        if backend != BackendType.LOCAL and backend != BackendType.CUSTOM_SIMULATOR and not token:
            # Check if token is available in environment
            if not os.environ.get("IBM_QUANTUM_TOKEN"):
                raise HTTPException(status_code=400, detail="IBM Quantum token is required for non-local execution")
            # If strictly required, we could set token = os.environ.get("IBM_QUANTUM_TOKEN") here, 
            # but execute_circuit_ibm handles the lookup now.

        # Create execution options
        options = QuantumExecutionOptions(
            backend=backend,
            token=token,
            shots=shots,
            initial_state=initial_state,
            custom_state=custom_state if custom_state else None,
            optimization_level=1,
            enable_transpilation=True,
            backend_name=backend_name
        )

        # Execute using unified API
        result = await QuantumAPI().execute_quantum_circuit(circuit, options)

        # Format response to match expected frontend interface
        response = {
            "success": result.success,
            "method": result.method,
            "backend": result.backend,
            "executionTime": result.execution_time
        }

        if result.qubit_results:
            response["qubitResults"] = result.qubit_results

        if result.job_id:
            response["jobId"] = result.job_id

        if result.status:
            response["status"] = result.status

        if result.message:
            response["message"] = result.message

        if result.error:
            response["error"] = result.error

        return response

    except HTTPException:
        raise
    except Exception as e:
        print(f"Circuit execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to execute quantum circuit: {str(e)}")


# ---------------------------------------------------------------------------
# TS-port real-valued simulator (density-matrix) wrapper
# ---------------------------------------------------------------------------
@app.post("/api/quantum/execute/ts-port")
async def execute_circuit_ts_port(data: Dict[str, Any]):
    """
    Execute using the Python port of the TS core (ts_sim_port.py).
    Accepts: { circuit: { numQubits, gates:[{name, qubits, parameters?}] }, initialState?: string }
    """
    try:
        circuit_data = data.get("circuit")
        initial_state = data.get("initialState")
        if not circuit_data or "numQubits" not in circuit_data or "gates" not in circuit_data:
            raise HTTPException(status_code=400, detail="Invalid circuit payload")

        gates = [
            TsGate(
                name=g.get("name"),
                qubits=g.get("qubits", []),
                parameters=g.get("parameters"),
            )
            for g in circuit_data.get("gates", [])
        ]
        circuit = TsCircuit(numQubits=circuit_data["numQubits"], gates=gates)

        result = simulate_circuit_ts(circuit, initial_state)
        return {
            "success": True,
            "backend": "ts-port",
            "result": {
                "statevector": result.get("statevector"),
                "probabilities": result.get("probabilities"),
                "densityMatrix": result.get("densityMatrix"),
                "reducedStates": result.get("reducedStates"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"TS-port execution error: {e}")
        raise HTTPException(status_code=500, detail=f"TS-port execution failed: {str(e)}")


# ---------------------------------------------------------------------------
# Complex statevector simulator wrapper (qiskit_simulator.py)
# ---------------------------------------------------------------------------
@app.post("/api/quantum/execute/statevector")
async def execute_circuit_statevector(data: Dict[str, Any]):
    """
    Execute using backend/qiskit_simulator.py (Qiskit-based simulation).
    Accepts: { circuit: { numQubits, gates:[{name, qubits, parameters?}] }, initialState: 'ket0'|..., customState? }
    """
    try:
        from qiskit_simulator import execute_circuit as execute_statevector

        result = execute_statevector(
            {
                "circuit": data.get("circuit"),
                "initialState": data.get("initialState", "ket0"),
                "customState": data.get("customState"),
            }
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Statevector execution failed"))
        return {
            "success": True,
            "backend": "statevector",
            "result": result,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Statevector execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Statevector execution failed: {str(e)}")

# Get available backends
@app.get("/api/quantum/backends")
async def get_backends(token: Optional[str] = None, instance: Optional[str] = None):
    try:
        print(f"Request for backends received. Token provided: {'YES' if token else 'NO'}")

        # Use unified API to get backends
        backends, error = await api_get_backends(token, instance)

        return {
            "success": True,
            "backends": backends,
            "isFallback": bool(error),
            "error": error
        }

    except Exception as e:
        print(f"Backend listing error: {e}")
        # Return default backends even on error
        default_backends = [
            {"id": "local", "name": "Local Simulator", "status": "available", "qubits": 24, "type": "simulator"},
            {"id": "custom_simulator", "name": "Custom Simulator", "status": "available", "qubits": 20, "type": "simulator"},
            {"id": "ibmq_qasm_simulator", "name": "IBM QASM Simulator", "status": "available", "qubits": 32, "type": "simulator"},
            {"id": "simulator_statevector", "name": "Statevector Simulator", "status": "available", "qubits": 24, "type": "simulator"},
            {"id": "simulator_mps", "name": "Matrix Product State Simulator", "status": "available", "qubits": 100, "type": "simulator"},
            {"id": "ibmq_manila", "name": "IBM Manila", "status": "available", "qubits": 5, "type": "hardware"},
            {"id": "ibmq_lima", "name": "IBM Lima", "status": "available", "qubits": 5, "type": "hardware"},
            {"id": "ibmq_belem", "name": "IBM Belem", "status": "available", "qubits": 5, "type": "hardware"},
            {"id": "ibmq_quito", "name": "IBM Quito", "status": "available", "qubits": 5, "type": "hardware"},
            {"id": "ibm_brisbane", "name": "IBM Brisbane", "status": "available", "qubits": 127, "type": "hardware"},
            {"id": "ibm_sherbrooke", "name": "IBM Sherbrooke", "status": "available", "qubits": 127, "type": "hardware"}
        ]
        return {"success": True, "backends": default_backends}

# Get job status
@app.get("/api/quantum/job/{job_id}/status")
async def get_job_status(job_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials if credentials else None

        if not token or not job_id:
            raise HTTPException(status_code=400, detail="Token and job ID are required")

        # Use QuantumAPI to get job status
        api = QuantumAPI()
        job_status = await api.get_job_status(job_id, token)
        
        return {
            "success": True,
            "jobId": job_status.job_id,
            "status": job_status.status,
            "statusMessage": job_status.status_message,
            "progress": job_status.progress,
            "estimatedTime": job_status.estimated_time,
            "backend": job_status.backend,
            "results": job_status.results
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Job status error: {e}")
        # Return error status
        return {
            "success": False,
            "jobId": job_id,
            "status": "ERROR",
            "statusMessage": f"Failed to get job status: {str(e)}",
            "progress": 0,
            "estimatedTime": None,
            "results": None
        }

# Get job result
@app.get("/api/quantum/job/{job_id}/result")
async def get_job_result(job_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials if credentials else None

        if not token or not job_id:
            raise HTTPException(status_code=400, detail="Token and job ID are required")

        # Use QuantumAPI to get job result
        api = QuantumAPI()
        job_result = await api.get_job_result(job_id, token)
        
        return job_result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Job result error: {e}")
        return {
            "success": False,
            "jobId": job_id,
            "results": None,
            "executionTime": 0,
            "backend": "unknown",
            "error": f"Failed to get job result: {str(e)}"
        }

# Get user jobs
@app.get("/api/quantum/jobs")
async def get_user_jobs(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials if credentials else None

        if not token:
            raise HTTPException(status_code=400, detail="Token is required")

        # Use unified API to get user jobs
        jobs = await api_get_user_jobs(token)
        return {"success": True, "jobs": jobs}

    except HTTPException:
        raise
    except Exception as e:
        print(f"User jobs error: {e}")
        return {"success": True, "jobs": []}

# AI Assistant endpoint
@app.post("/api/ai/ask")
async def ask_ai(data: Dict[str, str]):
    try:
        question = data.get("question", "").strip()

        if not question:
            raise HTTPException(status_code=400, detail="Question is required and must be a non-empty string")

        if len(question) > 1000:
            raise HTTPException(status_code=400, detail="Question is too long. Maximum 1000 characters allowed.")

        answer = await ask_ai_question(question)
        return {
            "success": True,
            "question": question,
            "answer": answer,
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"AI question error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get AI response" if os.getenv("NODE_ENV") != "development" else str(e)
        )

# Download Dataset Endpoint
@app.post("/api/download-dataset")
async def download_dataset():
    try:
        print("Initiating dataset download...")
        path = kagglehub.dataset_download("masoudnickparvar/brain-tumor-mri-dataset")
        return {
            "success": True,
            "path": path,
            "message": "Dataset downloaded successfully."
        }
    except Exception as e:
        print(f"Download Dataset API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# QUANTUM MACHINE LEARNING ENDPOINTS
# ============================================================================

# Feature Map Operations
@app.post("/api/quantum-ml/feature-maps")
async def create_feature_map(data: Dict[str, Any]):
    """Create and apply a quantum feature map"""
    try:
        map_type = data.get("type", "z")
        num_qubits = data.get("numQubits", 2)
        input_data = data.get("data", [])

        # Create feature map
        if map_type.lower() == "z":
            feature_map = ZFeatureMap(num_qubits)
        elif map_type.lower() == "zz":
            feature_map = ZZFeatureMap(num_qubits)
        elif map_type.lower() == "amplitude":
            feature_map = AmplitudeEncoding(num_qubits)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported feature map type: {map_type}")

        # Encode data
        circuit = feature_map.encode(input_data)

        return {
            "success": True,
            "featureMap": {
                "name": feature_map.name,
                "description": feature_map.description,
                "numQubits": num_qubits
            },
            "circuit": {
                "numQubits": circuit.num_qubits,
                "gates": [{"name": g.name, "qubits": g.qubits, "parameters": g.parameters} for g in circuit.gates]
            }
        }

    except Exception as e:
        print(f"Feature map error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create feature map: {str(e)}")

# Quantum Kernel Operations
@app.post("/api/quantum-ml/kernels")
async def compute_quantum_kernel(data: Dict[str, Any]):
    """Compute quantum kernel between data points"""
    try:
        kernel_type = data.get("type", "fidelity")
        feature_map_type = data.get("featureMap", "z")
        x1 = data.get("x1", [])
        x2 = data.get("x2", [])

        # Create feature map
        num_qubits = max(len(x1), len(x2), 2)
        if feature_map_type.lower() == "z":
            feature_map = ZFeatureMap(num_qubits)
        elif feature_map_type.lower() == "zz":
            feature_map = ZZFeatureMap(num_qubits)
        else:
            feature_map = ZFeatureMap(num_qubits)

        # Create kernel
        if kernel_type.lower() == "fidelity":
            kernel = FidelityQuantumKernel()
        elif kernel_type.lower() == "projected":
            kernel = ProjectedQuantumKernel()
        else:
            kernel = FidelityQuantumKernel()

        # Compute kernel
        kernel_value = kernel.compute_kernel(x1, x2, feature_map)

        return {
            "success": True,
            "kernel": {
                "type": kernel.name,
                "value": kernel_value,
                "featureMap": feature_map.name
            }
        }

    except Exception as e:
        print(f"Quantum kernel error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to compute quantum kernel: {str(e)}")

# Variational Quantum Circuit Operations
@app.post("/api/quantum-ml/variational-circuits")
async def create_variational_circuit(data: Dict[str, Any]):
    """Create a variational quantum circuit"""
    try:
        num_qubits = data.get("numQubits", 2)
        num_layers = data.get("numLayers", 1)
        ansatz_type = data.get("ansatzType", "hardware_efficient")
        parameters = data.get("parameters", [])

        # Create variational layer
        variational_layer = VariationalLayer(
            num_qubits=num_qubits,
            num_layers=num_layers,
            ansatz_type=ansatz_type
        )

        # Build circuit
        circuit = variational_layer.build_circuit(parameters)

        return {
            "success": True,
            "circuit": {
                "numQubits": circuit.num_qubits,
                "gates": [{"name": g.name, "qubits": g.qubits, "parameters": g.parameters} for g in circuit.gates],
                "numParameters": variational_layer.num_parameters
            },
            "layer": {
                "name": variational_layer.name,
                "description": variational_layer.description,
                "numParameters": variational_layer.num_parameters
            }
        }

    except Exception as e:
        print(f"Variational circuit error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create variational circuit: {str(e)}")

# Variational Quantum Classifier
@app.post("/api/quantum-ml/vqc/train")
async def train_vqc(data: Dict[str, Any]):
    """Train a Variational Quantum Classifier"""
    try:
        # Extract configuration
        feature_map_type = data.get("featureMap", "z")
        num_qubits = data.get("numQubits", 2)
        variational_layers = data.get("variationalLayers", 1)
        training_data = data.get("trainingData", [])
        labels = data.get("labels", [])
        max_iterations = data.get("maxIterations", 100)

        # Create feature map
        if feature_map_type.lower() == "z":
            feature_map = ZFeatureMap(num_qubits)
        elif feature_map_type.lower() == "zz":
            feature_map = ZZFeatureMap(num_qubits)
        else:
            feature_map = ZFeatureMap(num_qubits)

        # Create variational layer
        variational_layer = VariationalLayer(num_qubits, variational_layers)

        # Create measurement layer
        measurement_layer = MeasurementLayer(num_qubits)

        # Create VQC config
        config = VQCConfig(
            feature_map=feature_map,
            variational_layer=variational_layer,
            measurement_layer=measurement_layer,
            max_iterations=max_iterations
        )

        # Create and train VQC
        vqc = VariationalQuantumClassifier(config)

        # Convert training data to expected format
        train_samples = [(x, y) for x, y in zip(training_data, labels)]

        # Train the model
        training_result = vqc.train(train_samples, labels, max_iterations)

        return {
            "success": True,
            "model": {
                "type": "VQC",
                "featureMap": feature_map.name,
                "numQubits": num_qubits,
                "numParameters": variational_layer.num_parameters
            },
            "training": training_result,
            "parameters": vqc.parameters
        }

    except Exception as e:
        print(f"VQC training error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to train VQC: {str(e)}")

@app.post("/api/quantum-ml/vqc/predict")
async def predict_vqc(data: Dict[str, Any]):
    """Make predictions with a trained VQC"""
    try:
        parameters = data.get("parameters", [])
        feature_map_type = data.get("featureMap", "z")
        num_qubits = data.get("numQubits", 2)
        input_data = data.get("inputData", [])

        # Recreate model configuration
        if feature_map_type.lower() == "z":
            feature_map = ZFeatureMap(num_qubits)
        else:
            feature_map = ZFeatureMap(num_qubits)

        variational_layer = VariationalLayer(num_qubits)
        measurement_layer = MeasurementLayer(num_qubits)

        config = VQCConfig(
            feature_map=feature_map,
            variational_layer=variational_layer,
            measurement_layer=measurement_layer
        )

        # Create model and set parameters
        vqc = VariationalQuantumClassifier(config)
        vqc.parameters = parameters

        # Make prediction
        prediction = vqc.predict(input_data)

        return {
            "success": True,
            "prediction": prediction
        }

    except Exception as e:
        print(f"VQC prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to make VQC prediction: {str(e)}")

# ============================================================================
# ASYNCHRONOUS QUANTUM EXECUTION ENDPOINTS
# ============================================================================

# Asynchronous Circuit Execution
@app.post("/api/quantum/async/execute")
async def execute_circuit_async(data: Dict[str, Any]):
    """Execute quantum circuit asynchronously using worker"""
    try:
        circuit = data.get("circuit")
        initial_state = data.get("initialState", "ket0")
        task_id = data.get("taskId", f"task_{int(time.time() * 1000)}")

        if not circuit:
            raise HTTPException(status_code=400, detail="Circuit is required")

        # Create worker and execute asynchronously
        async with QuantumWorker() as worker:
            message = {
                "type": "simulate",
                "id": task_id,
                "data": {
                    "circuit": circuit,
                    "initialState": initial_state
                }
            }

            # Execute asynchronously
            response = await worker.execute(message)

            if response.type == "error":
                raise HTTPException(status_code=500, detail=response.error)

            return {
                "success": True,
                "taskId": task_id,
                "result": response.data,
                "status": "completed"
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Async execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to execute circuit asynchronously: {str(e)}")

# Worker Pool Status
@app.get("/api/quantum/workers/status")
async def get_worker_status():
    """Get status of quantum worker pool"""
    try:
        # For now, return basic status - in production would track actual pool
        return {
            "success": True,
            "workers": {
                "active": 1,
                "available": 4,
                "total": 4
            },
            "queue": {
                "pending": 0,
                "processing": 0
            }
        }

    except Exception as e:
        print(f"Worker status error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get worker status: {str(e)}")

# ============================================================================
# DATA PREPROCESSING ENDPOINTS
# ============================================================================

# Data Preprocessing
@app.post("/api/quantum-ml/preprocessing")
async def preprocess_data(data: Dict[str, Any]):
    """Apply quantum data preprocessing"""
    try:
        raw_data = data.get("data", [])
        config = data.get("config", {})

        # Convert to DataSample format
        samples = [
            DataSample(
                features=point.get("features", []),
                label=point.get("label"),
                target=point.get("target")
            )
            for point in raw_data
        ]

        # Create preprocessor
        preprocessor = QuantumDataPreprocessor(config)

        # Fit and transform
        processed_samples = preprocessor.fit_transform(samples)

        # Convert back to dict format
        processed_data = [
            {
                "features": sample.features,
                "label": sample.label,
                "target": sample.target,
                "metadata": sample.metadata
            }
            for sample in processed_samples
        ]

        return {
            "success": True,
            "processedData": processed_data,
            "statistics": preprocessor.get_statistics(),
            "config": preprocessor.export_config()
        }

    except Exception as e:
        print(f"Data preprocessing error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to preprocess data: {str(e)}")

# Generate Synthetic Datasets
@app.post("/api/quantum-ml/datasets/generate")
async def generate_dataset(data: Dict[str, Any]):
    """Generate synthetic quantum ML datasets"""
    try:
        dataset_type = data.get("type", "classification")
        subtype = data.get("subtype", "circles")
        num_samples = data.get("numSamples", 100)

        if dataset_type == "classification":
            features, labels = generate_classification_dataset(subtype, num_samples)
        elif dataset_type == "regression":
            features, labels = generate_regression_dataset(subtype, num_samples)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported dataset type: {dataset_type}")

        # Convert to expected format
        dataset = [
            {
                "features": feat,
                "label": int(label) if isinstance(label, (int, float)) and dataset_type == "classification" else label,
                "target": label if dataset_type == "regression" else None
            }
            for feat, label in zip(features, labels)
        ]

        return {
            "success": True,
            "dataset": dataset,
            "type": dataset_type,
            "subtype": subtype,
            "numSamples": num_samples
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Dataset generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate dataset: {str(e)}")

# Analyze Quantum Readiness
@app.post("/api/quantum-ml/analysis/quantum-readiness")
async def analyze_quantum_readiness_endpoint(data: Dict[str, Any]):
    """Analyze data for quantum ML compatibility"""
    try:
        raw_data = data.get("data", [])

        # Convert to DataSample format
        samples = [
            DataSample(
                features=point.get("features", []),
                label=point.get("label")
            )
            for point in raw_data
        ]

        # Analyze quantum readiness
        analysis = analyze_quantum_readiness(samples)

        return {
            "success": True,
            "analysis": analysis
        }

    except Exception as e:
        print(f"Quantum readiness analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze quantum readiness: {str(e)}")

# Model Evaluation
@app.post("/api/quantum-ml/evaluation")
async def evaluate_model(data: Dict[str, Any]):
    """Evaluate quantum ML model performance"""
    try:
        predictions = data.get("predictions", [])
        true_labels = data.get("trueLabels", [])
        targets = data.get("targets", [])
        evaluation_type = data.get("type", "classification")

        if evaluation_type == "classification":
            metrics = evaluate_classification(predictions, true_labels)
        elif evaluation_type == "regression":
            metrics = evaluate_regression(predictions, targets)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported evaluation type: {evaluation_type}")

        return {
            "success": True,
            "metrics": {
                "accuracy": metrics.accuracy,
                "precision": metrics.precision,
                "recall": metrics.recall,
                "f1Score": metrics.f1_score,
                "mse": metrics.mse,
                "mae": metrics.mae
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Model evaluation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to evaluate model: {str(e)}")

# Helper functions
async def get_backend_info(token: str, backend_id: str) -> Dict[str, Any]:
    """Get backend information from IBM Quantum"""
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://api.quantum.ibm.com/runtime/backends/{backend_id}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status >= 400:
                    raise Exception(f"Backend info request failed: {response.status}")

                backend = await response.json()
                return {
                    "id": backend_id,
                    "name": backend.get("name", backend_id),
                    "status": backend.get("status", "available"),
                    "qubits": backend.get("n_qubits", backend.get("num_qubits", 0)),
                    "type": "simulator" if backend.get("simulator") else "hardware"
                }
    except Exception as e:
        print(f"Backend info error: {e}")

        # Return default info for common backends
        default_backends = {
            "ibmq_qasm_simulator": {"name": "IBM QASM Simulator", "qubits": 32, "type": "simulator"},
            "simulator_statevector": {"name": "Statevector Simulator", "qubits": 24, "type": "simulator"},
            "simulator_mps": {"name": "Matrix Product State Simulator", "qubits": 100, "type": "simulator"},
            "ibmq_manila": {"name": "IBM Manila", "qubits": 5, "type": "hardware"},
            "ibmq_lima": {"name": "IBM Lima", "qubits": 5, "type": "hardware"},
            "ibmq_belem": {"name": "IBM Belem", "qubits": 5, "type": "hardware"},
            "ibmq_quito": {"name": "IBM Quito", "qubits": 5, "type": "hardware"},
            "ibm_brisbane": {"name": "IBM Brisbane", "qubits": 127, "type": "hardware"},
            "ibm_sherbrooke": {"name": "IBM Sherbrooke", "qubits": 127, "type": "hardware"}
        }

        return {
            "id": backend_id,
            "name": default_backends.get(backend_id, {}).get("name", backend_id),
            "status": "available",
            "qubits": default_backends.get(backend_id, {}).get("qubits", 0),
            "type": default_backends.get(backend_id, {}).get("type", "simulator")
        }

async def get_available_backends(token: Optional[str] = None) -> tuple[List[Dict[str, Any]], bool]:
    """Get available backends from IBM Quantum"""
    try:
        effective_token = token if token is not None else os.getenv("IBM_QUANTUM_TOKEN")

        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://api.quantum.ibm.com/runtime/backends",
                headers={
                    "Authorization": f"Bearer {effective_token}",
                    "Content-Type": "application/json"
                },
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status >= 400:
                    raise Exception(f"Backend listing failed: {response.status}")

                backends_data = await response.json()
                backends = [
                    {
                        "id": backend.get("name", backend.get("id", "")),
                        "name": backend.get("name", backend.get("id", "")),
                        "status": backend.get("status", "available"),
                        "qubits": backend.get("n_qubits", backend.get("num_qubits", 0)),
                        "type": "simulator" if backend.get("simulator") else "hardware"
                    }
                    for backend in backends_data
                ]
                return backends, False

    except Exception as e:
        print(f"Backend listing error: {e}")

        # Return default backends
        default_backends = [
            {"id": "ibmq_qasm_simulator", "name": "IBM QASM Simulator", "status": "available", "qubits": 32, "type": "simulator"},
            {"id": "simulator_statevector", "name": "Statevector Simulator", "status": "available", "qubits": 24, "type": "simulator"},
            {"id": "simulator_mps", "name": "Matrix Product State Simulator", "status": "available", "qubits": 100, "type": "simulator"},
            {"id": "ibmq_manila", "name": "IBM Manila", "status": "available", "qubits": 5, "type": "hardware"},
            {"id": "ibmq_lima", "name": "IBM Lima", "status": "available", "qubits": 5, "type": "hardware"},
            {"id": "ibmq_belem", "name": "IBM Belem", "status": "available", "qubits": 5, "type": "hardware"},
            {"id": "ibmq_quito", "name": "IBM Quito", "status": "available", "qubits": 5, "type": "hardware"},
            {"id": "ibm_brisbane", "name": "IBM Brisbane", "status": "available", "qubits": 127, "type": "hardware"},
            {"id": "ibm_sherbrooke", "name": "IBM Sherbrooke", "status": "available", "qubits": 127, "type": "hardware"}
        ]
        return default_backends, True

async def get_ibm_job_status(token: str, job_id: str) -> Dict[str, Any]:
    """Get IBM Quantum job status"""
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://api.quantum.ibm.com/runtime/jobs/{job_id}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 404:
                    return {
                        "jobId": job_id,
                        "status": "COMPLETED",
                        "statusMessage": "Job completed successfully",
                        "progress": 100,
                        "estimatedTime": None,
                        "results": None
                    }
                elif response.status >= 400:
                    raise Exception(f"Job status request failed: {response.status}")

                job = await response.json()
                return {
                    "jobId": job.get("id", job_id),
                    "status": map_runtime_status(job.get("status", "RUNNING")),
                    "statusMessage": get_status_message(job.get("status", "RUNNING")),
                    "progress": job.get("progress", 100 if job.get("status") == "COMPLETED" else 50),
                    "estimatedTime": job.get("estimated_time"),
                    "results": job.get("results")
                }

    except Exception as e:
        print(f"Job status error: {e}")

        return {
            "jobId": job_id,
            "status": "RUNNING",
            "statusMessage": "Job is running on IBM Quantum hardware",
            "progress": 50,
            "estimatedTime": None,
            "results": None
        }

async def get_ibm_job_result(token: str, job_id: str) -> Dict[str, Any]:
    """Get IBM Quantum job result"""
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://api.quantum.ibm.com/runtime/jobs/{job_id}/results",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status >= 400:
                    raise Exception(f"Job result request failed: {response.status}")

                return {
                    "jobId": job_id,
                    "results": await response.json(),
                    "executionTime": 0,  # Not available in Runtime API
                    "backend": "unknown"
                }

    except Exception as e:
        print(f"Job result error: {e}")

        return {
            "jobId": job_id,
            "results": None,
            "executionTime": 0,
            "backend": "unknown",
            "error": "Results not available through Runtime API"
        }

async def get_ibm_user_jobs(token: str) -> List[Dict[str, Any]]:
    """Get IBM Quantum user jobs"""
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://api.quantum.ibm.com/runtime/jobs",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status >= 400:
                    raise Exception(f"User jobs request failed: {response.status}")

                jobs_data = await response.json()
                return [
                    {
                        "jobId": job.get("id", job.get("job_id", "")),
                        "status": map_runtime_status(job.get("status", "RUNNING")),
                        "backend": job.get("backend", "unknown"),
                        "createdAt": job.get("created_at", datetime.utcnow().isoformat()),
                        "completedAt": job.get("completed_at"),
                        "progress": job.get("progress", 100 if job.get("status") == "COMPLETED" else 50)
                    }
                    for job in jobs_data
                ]

    except Exception as e:
        print(f"User jobs error: {e}")
        return []

def map_runtime_status(runtime_status: str) -> str:
    """Map Runtime API status to our format"""
    status_map = {
        "COMPLETED": "COMPLETED",
        "FAILED": "FAILED",
        "CANCELLED": "CANCELLED",
        "RUNNING": "RUNNING",
        "QUEUED": "QUEUED",
        "PENDING": "QUEUED",
        "DONE": "COMPLETED",
        "ERROR": "FAILED"
    }
    return status_map.get(runtime_status, "RUNNING")

def get_status_message(status: str) -> str:
    """Get status message for a given status"""
    messages = {
        "CREATED": "Job created and queued",
        "QUEUED": "Job is queued for execution",
        "RUNNING": "Job is currently running",
        "COMPLETED": "Job completed successfully",
        "FAILED": "Job failed to execute",
        "CANCELLED": "Job was cancelled",
        "ERROR": "Job encountered an error",
        "PENDING": "Job is pending execution",
        "IN_PROGRESS": "Job is in progress",
        "DONE": "Job completed successfully",
        "INITIALIZING": "Job is initializing",
        "VALIDATING": "Job is being validated",
        "QUEUED_REMOTE": "Job queued on remote backend",
        "RUNNING_REMOTE": "Job running on remote backend",
        "COMPLETED_REMOTE": "Job completed on remote backend"
    }
    return messages.get(status, "Job status unknown")

# Error handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if os.getenv("NODE_ENV") == "development" else "Something went wrong"
        }
    )

# 404 handler
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Endpoint not found"}
    )

# ---------------------------------------------------------------------------
# Quantum Medical Core Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/medical/load-drive")
async def load_drive_dataset(data: Dict[str, Any]):
    """Load dataset from a public Google Drive link"""
    try:
        url = data.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Download and parse
        df = download_csv_from_drive(url)
        
        # Train model
        result = medical_core.train(df)
        
        return {
            "success": True,
            "message": f"Successfully loaded {result['sample_count']} records",
            "features": result['features'],
            "classes": result['classes']
        }
    except Exception as e:
        print(f"Drive load error: {e}")
        return JSONResponse(status_code=400, content={"success": False, "error": str(e)})

@app.post("/api/medical/analyze")
async def analyze_patient(data: Dict[str, Any]):
    """Analyze new patient data against loaded dataset"""
    try:
        patient_data = data.get("patientData")
        if not patient_data:
            raise HTTPException(status_code=400, detail="patientData is required")
        
        result = medical_core.predict(patient_data)
        
        return {
            "success": True,
            "result": result
        }
    except Exception as e:
        print(f"Analysis error: {e}")
        return JSONResponse(status_code=400, content={"success": False, "error": str(e)})

@app.get("/api/medical/status")
async def get_medical_status():
    """Check if medical model is trained"""
    return {
        "isTrained": medical_core.dataset is not None,
        "sampleCount": len(medical_core.dataset) if medical_core.dataset is not None else 0,
        "classes": medical_core.dataset[medical_core.target].unique().tolist() if medical_core.dataset is not None else []
    }

@app.on_event("startup")
async def startup_event():
    """Auto-load dataset if configured"""
    url = os.getenv("MEDICAL_DATASET_URL")
    if url:
        print(f"Auto-loading Medical Dataset from: {url}")
        try:
            # Run download in a separate thread to avoid blocking if using sync requests
            # For simplicity in this demo, we run it directly as it's start-up
            df = download_csv_from_drive(url)
            result = medical_core.train(df)
            print(f"Medical Dataset Loaded: {result['sample_count']} records")
        except Exception as e:
            print(f"WARNING: Failed to auto-load Medical Dataset: {e}")
            print("Please ensure MEDICAL_DATASET_URL points to a public CSV FILE (not folder).")

if __name__ == "__main__":
    import uvicorn
    port = 3005 # Match frontend configuration
    print(f"Quantum Backend API running on port {port}")
    print(f"Health check: http://localhost:{port}/health")
    print(f"CORS enabled for: {os.getenv('FRONTEND_URL', 'http://localhost:5173')}")
    uvicorn.run(app, host="0.0.0.0", port=port)
