import os
from typing import Dict, List, Any, Optional
try:
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2, Options
    # SamplerV2 is the new API (2024+)
    SAMPLER_V2_AVAILABLE = True
except ImportError as e:
    raise ImportError("qiskit-ibm-runtime not installed. Install with: pip install qiskit-ibm-runtime") from e

from qiskit import transpile
from circuit_converter import json_to_quantum_circuit
import traceback

# Lazy import to avoid circular dependency
def get_logger():
    from container import container
    return container.logger()

class IBMQuantumService:
    def __init__(self):
        self.services: Dict[str, QiskitRuntimeService] = {}
        self.service_configs: Dict[str, Dict[str, Any]] = {}  # Store channel/instance per token

    def _detect_channel(self, token: str) -> tuple[str, Optional[str]]:
        """
        Detect if token is for IBM Quantum Platform or IBM Cloud
        IBM Quantum Platform tokens are typically shorter and alphanumeric
        IBM Cloud uses IAM tokens (longer, base64-like)
        """
        # If token is very long (>100 chars), likely IBM Cloud IAM token
        if len(token) > 100:
            get_logger().info("ibm_channel_detected", channel="ibm_cloud", token_length=len(token))
            return "ibm_cloud", None
        
        # Default to IBM Quantum Platform
        get_logger().info("ibm_channel_detected", channel="ibm_quantum_platform", token_length=len(token))
        return "ibm_quantum_platform", None

    def get_service(self, token: str, channel: Optional[str] = None, instance: Optional[str] = None) -> QiskitRuntimeService:
        """Get or create QiskitRuntimeService for a token"""
        cache_key = f"{token}:{channel}:{instance}"
        
        if cache_key not in self.services:
            # Auto-detect channel if not provided
            if not channel:
                channel, instance = self._detect_channel(token)
            
            get_logger().info(
                "ibm_service_initializing",
                channel=channel,
                token_prefix=token[:10] if token else "none"
            )
            
            try:
                if channel == "ibm_cloud" and instance:
                    # IBM Cloud requires instance CRN
                    self.services[cache_key] = QiskitRuntimeService(
                        channel="ibm_cloud",
                        token=token,
                        instance=instance
                    )
                else:
                    # IBM Quantum Platform
                    self.services[cache_key] = QiskitRuntimeService(
                        channel="ibm_quantum_platform",
                        token=token
                    )
                
                # Store config for this token
                self.service_configs[token] = {"channel": channel, "instance": instance}
                
                get_logger().info("ibm_service_created", channel=channel, success=True)
                
            except Exception as e:
                get_logger().error(
                    "ibm_service_creation_failed",
                    channel=channel,
                    error=str(e),
                    traceback=traceback.format_exc()
                )
                raise
        
        return self.services[cache_key]

    async def validate_token(self, token: str, channel: Optional[str] = None, instance: Optional[str] = None):
        """Validate IBM Quantum token and return account info"""
        try:
            get_logger().info("ibm_token_validation_start", token_prefix=token[:10] if token else "none")
            
            # Fallback to env var if token not provided
            if not token:
                token = os.getenv("IBM_QUANTUM_TOKEN")
                if token:
                    get_logger().info("ibm_using_env_token")

            if not token or len(token) < 10:
                error_msg = "Token is too short or empty"
                get_logger().error("ibm_token_validation_failed", error=error_msg)
                return {"success": False, "error": error_msg}
            
            # Get service
            service = self.get_service(token, channel, instance)
            
            # Validate by fetching account info
            account = service.active_account()
            get_logger().info("ibm_account_info", account=account)
            
            if not account:
                error_msg = "Could not retrieve account information"
                get_logger().error("ibm_token_validation_failed", error=error_msg)
                return {"success": False, "error": error_msg}
            
            # Try to list backends to verify connectivity
            backends = service.backends(limit=1)
            hub = account.get("hub", "default")
            group = account.get("group", "default")
            project = account.get("project", "default")
            
            get_logger().info(
                "ibm_token_validation_success",
                hub=hub,
                group=group,
                project=project,
                backends_available=len(list(backends)) > 0
            )
            
            return {
                "success": True,
                "hub": hub,
                "group": group,
                "project": project,
                "channel": self.service_configs.get(token, {}).get("channel", "ibm_quantum_platform")
            }
            
        except Exception as e:
            error_msg = str(e)
            get_logger().error(
                "ibm_token_validation_failed",
                error=error_msg,
                traceback=traceback.format_exc()
            )
            return {"success": False, "error": error_msg}


    async def get_backends(self, token: str):
        """Get available IBM Quantum backends"""
        try:
            get_logger().info("ibm_get_backends_start", token_prefix=token[:10] if token else "none")
            
            if not token:
                token = os.getenv("IBM_QUANTUM_TOKEN")

            service = self.get_service(token)
            backends = service.backends()
            
            backend_list = []
            for backend in backends:
                try:
                    status = backend.status()
                    backend_info = {
                        "id": backend.name,
                        "name": backend.name,
                        "qubits": backend.num_qubits,
                        "status": "online" if status.operational else "offline",
                        "type": "processor" if not backend.simulator else "simulator",
                        "pending_jobs": status.pending_jobs if hasattr(status, 'pending_jobs') else 0
                    }
                    backend_list.append(backend_info)
                except Exception as e:
                    get_logger().warning("ibm_backend_info_error", backend=backend.name, error=str(e))
                    continue
            
            get_logger().info("ibm_get_backends_success", count=len(backend_list))
            
            return {
                "success": True, 
                "backends": backend_list
            }
        except Exception as e:
            error_msg = str(e)
            get_logger().error(
                "ibm_get_backends_failed",
                error=error_msg,
                traceback=traceback.format_exc()
            )
            return {"success": False, "error": error_msg}

    async def submit_job(self, token: str, backend_name: str, circuit_json: Dict[str, Any], shots: int = 1024):
        """Submit quantum circuit job to IBM Quantum"""
        try:
            get_logger().info(
                "ibm_submit_job_start",
                backend=backend_name,
                shots=shots,
                num_qubits=circuit_json.get("numQubits", 0),
                num_gates=len(circuit_json.get("gates", []))
            )
            
            if not token:
                token = os.getenv("IBM_QUANTUM_TOKEN")

            service = self.get_service(token)
            backend = service.backend(backend_name)
            
            get_logger().info("ibm_backend_retrieved", backend=backend_name, operational=backend.status().operational)
            
            # Convert JSON to Qiskit Circuit
            qc = json_to_quantum_circuit(circuit_json)
            qc.measure_all()
            
            get_logger().debug("ibm_circuit_converted", num_qubits=qc.num_qubits, num_gates=len(qc.data))
            
            # Transpile for target backend
            transpiled_qc = transpile(qc, backend=backend, optimization_level=1)
            
            get_logger().debug("ibm_circuit_transpiled", num_gates=len(transpiled_qc.data))
            
            # NEW QISKIT RUNTIME API (2024+)
            # SamplerV2 requires: service and backend name
            # No more Session wrapper needed - SamplerV2 handles sessions internally
            get_logger().info(
                "ibm_creating_sampler_v2",
                backend=backend_name,
                service_active=service.active_account() is not None
            )
            
            # Create SamplerV2 with service and backend
            sampler = SamplerV2(service=service, backend=backend_name)
            
            get_logger().debug("ibm_sampler_v2_created", backend=backend_name)
            
            # Run the job with SamplerV2
            # SamplerV2.run() signature: run(pubs, shots=None)
            # pubs can be a single circuit or list of circuits
            job = sampler.run([transpiled_qc], shots=shots)
            
            job_id = job.job_id()
            job_status = job.status().name
            
            get_logger().info(
                "ibm_job_submitted",
                job_id=job_id,
                status=job_status,
                backend=backend_name
            )
            
            return {
                "success": True,
                "jobId": job_id,
                "status": job_status,
                "backend": backend_name
            }
            
        except Exception as e:
            error_msg = str(e)
            get_logger().error(
                "ibm_submit_job_failed",
                backend=backend_name,
                error=error_msg,
                traceback=traceback.format_exc()
            )
            return {"success": False, "error": error_msg}

    async def get_job_result(self, token: str, job_id: str):
        """Get IBM Quantum job result"""
        try:
            get_logger().info("ibm_get_job_result_start", job_id=job_id)
            
            if not token:
                token = os.getenv("IBM_QUANTUM_TOKEN")

            service = self.get_service(token)
            job = service.job(job_id)
            
            if not job:
                error_msg = f"Job {job_id} not found"
                get_logger().error("ibm_job_not_found", job_id=job_id)
                return {"success": False, "error": error_msg}
            
            status = job.status().name
            get_logger().info("ibm_job_status", job_id=job_id, status=status)
            
            if status == "DONE":
                result = job.result()
                
                # Get quasi-probability distribution from first (only) circuit
                if hasattr(result, 'quasi_dists') and result.quasi_dists:
                    quasi_dist = result.quasi_dists[0]
                    
                    # Get number of qubits from metadata
                    num_qubits = 1
                    if result.metadata and len(result.metadata) > 0:
                        num_qubits = result.metadata[0].get("num_qubits", 1)
                    elif quasi_dist:
                        # Fallback: calculate from largest key
                        max_key = max(quasi_dist.keys()) if quasi_dist else 0
                        num_qubits = max_key.bit_length() if max_key > 0 else 1
                    
                    # Format counts for frontend (binary string keys)
                    formatted_counts = {
                        format(k, f'0{num_qubits}b'): float(v) 
                        for k, v in quasi_dist.items()
                    }
                    
                    execution_time = 0
                    if result.metadata and len(result.metadata) > 0:
                        execution_time = result.metadata[0].get("time_taken", 0)
                    
                    get_logger().info(
                        "ibm_job_result_retrieved",
                        job_id=job_id,
                        num_qubits=num_qubits,
                        counts_size=len(formatted_counts),
                        execution_time=execution_time
                    )
                    
                    return {
                        "success": True,
                        "status": status,
                        "results": formatted_counts,
                        "executionTime": execution_time,
                        "jobId": job_id
                    }
                else:
                    get_logger().warning("ibm_job_no_results", job_id=job_id)
                    return {
                        "success": True,
                        "status": status,
                        "results": {},
                        "executionTime": 0,
                        "jobId": job_id,
                        "message": "Job completed but no results available"
                    }
            
            # Job still running or in queue
            progress = 0
            if hasattr(job, 'status'):
                job_status_obj = job.status()
                if hasattr(job_status_obj, 'progress'):
                    progress = job_status_obj.progress
            
            return {
                "success": True,
                "status": status,
                "jobId": job_id,
                "progress": progress,
                "statusMessage": f"Job is {status.lower()}"
            }
            
        except Exception as e:
            error_msg = str(e)
            get_logger().error(
                "ibm_get_job_result_failed",
                job_id=job_id,
                error=error_msg,
                traceback=traceback.format_exc()
            )
            return {"success": False, "error": error_msg}

ibm_service_instance = IBMQuantumService()
