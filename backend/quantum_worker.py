"""
Asynchronous Quantum Worker Module
Provides non-blocking quantum simulations using Python's threading and multiprocessing capabilities.
Equivalent to the TypeScript web worker functionality.
"""

import asyncio
import concurrent.futures
import threading
import multiprocessing
from typing import Dict, Any, List, Optional, Callable, Union, Awaitable
from dataclasses import dataclass
from enum import Enum
import numpy as np

try:
    # Try relative imports first (when imported as module)
    from .circuit_operations import QuantumCircuit, simulate_circuit, matrix_multiply as np_matrix_multiply, tensor_product as np_tensor_product
    from .quantum_simulation import matrix_multiply, tensor_product
except ImportError:
    # Fall back to absolute imports (when run directly)
    from circuit_operations import QuantumCircuit, simulate_circuit, matrix_multiply as np_matrix_multiply, tensor_product as np_tensor_product
    from quantum_simulation import matrix_multiply, tensor_product


class WorkerMessageType(Enum):
    SIMULATE = "simulate"
    MATRIX_MULTIPLY = "matrix_multiply"
    TENSOR_PRODUCT = "tensor_product"


@dataclass
class WorkerMessage:
    type: WorkerMessageType
    id: str
    data: Dict[str, Any]


@dataclass
class WorkerResponse:
    type: str  # 'result' or 'error'
    id: str
    data: Optional[Any] = None
    error: Optional[str] = None
    progress: Optional[Dict[str, Any]] = None


class QuantumWorker:
    """
    Asynchronous quantum worker that runs computations in background threads/processes.
    Provides similar functionality to the TypeScript web worker.
    """

    def __init__(self, use_processes: bool = False, max_workers: Optional[int] = None):
        """
        Initialize the quantum worker.

        Args:
            use_processes: If True, use ProcessPoolExecutor; otherwise ThreadPoolExecutor
            max_workers: Maximum number of worker threads/processes
        """
        self.use_processes = use_processes
        self.max_workers = max_workers or (multiprocessing.cpu_count() if use_processes else None)
        self.executor = None
        self._lock = threading.Lock()
        self._active_tasks: Dict[str, asyncio.Task] = {}

    async def __aenter__(self):
        """Async context manager entry"""
        self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.shutdown()

    def start(self):
        """Start the worker executor"""
        with self._lock:
            if self.executor is None:
                if self.use_processes:
                    self.executor = concurrent.futures.ProcessPoolExecutor(max_workers=self.max_workers)
                else:
                    self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers)

    async def shutdown(self, wait: bool = True):
        """Shutdown the worker executor"""
        with self._lock:
            if self.executor:
                # Cancel all active tasks
                for task in self._active_tasks.values():
                    if not task.done():
                        task.cancel()

                self.executor.shutdown(wait=wait)
                self.executor = None

    async def execute(self, message: WorkerMessage, progress_callback: Optional[Callable[[WorkerResponse], Awaitable[None]]] = None) -> WorkerResponse:
        """
        Execute a quantum computation asynchronously.

        Args:
            message: The worker message containing operation type and data
            progress_callback: Optional callback for progress updates

        Returns:
            WorkerResponse with result or error
        """
        try:
            # Create a task for this execution
            task = asyncio.create_task(self._execute_task(message, progress_callback))
            self._active_tasks[message.id] = task

            result = await task
            return result

        except asyncio.CancelledError:
            return WorkerResponse(type='error', id=message.id, error='Task cancelled')
        except Exception as e:
            return WorkerResponse(type='error', id=message.id, error=str(e))
        finally:
            # Clean up task reference
            self._active_tasks.pop(message.id, None)

    async def _execute_task(self, message: WorkerMessage, progress_callback: Optional[Callable[[WorkerResponse], Awaitable[None]]]) -> WorkerResponse:
        """Internal task execution"""
        loop = asyncio.get_event_loop()

        try:
            # Run the computation in executor
            result = await loop.run_in_executor(self.executor, self._run_operation, message, progress_callback)

            return WorkerResponse(type='result', id=message.id, data=result)

        except Exception as e:
            return WorkerResponse(type='error', id=message.id, error=str(e))

    def _run_operation(self, message: WorkerMessage, progress_callback: Optional[Callable]) -> Any:
        """Run the actual operation in the executor"""
        if message.type == WorkerMessageType.SIMULATE:
            return self._simulate_circuit(message.data)
        elif message.type == WorkerMessageType.MATRIX_MULTIPLY:
            return self._matrix_multiply(message.data)
        elif message.type == WorkerMessageType.TENSOR_PRODUCT:
            return self._tensor_product(message.data)
        else:
            raise ValueError(f"Unknown operation type: {message.type}")

    def _simulate_circuit(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate a quantum circuit"""
        circuit_data = data.get('circuit', {})
        initial_state = data.get('initialState')

        # Convert circuit data to QuantumCircuit object
        circuit = QuantumCircuit(
            num_qubits=circuit_data.get('numQubits', 1),
            gates=circuit_data.get('gates', [])
        )

        # Run simulation
        result = simulate_circuit(circuit, initial_state)

        # Convert numpy arrays to lists for JSON serialization
        if 'statevector' in result and isinstance(result['statevector'], np.ndarray):
            result['statevector'] = result['statevector'].tolist()
        if 'density_matrix' in result and isinstance(result['density_matrix'], np.ndarray):
            result['density_matrix'] = result['density_matrix'].tolist()
        if 'reduced_states' in result:
            result['reduced_states'] = [
                state.tolist() if isinstance(state, np.ndarray) else state
                for state in result['reduced_states']
            ]

        return result

    def _matrix_multiply(self, data: Dict[str, Any]) -> List[List[complex]]:
        """Matrix multiplication"""
        A = np.array(data.get('A', []), dtype=complex)
        B = np.array(data.get('B', []), dtype=complex)

        result = np_matrix_multiply(A, B)
        return result.tolist()

    def _tensor_product(self, data: Dict[str, Any]) -> List[List[complex]]:
        """Tensor product"""
        A = np.array(data.get('A', []), dtype=complex)
        B = np.array(data.get('B', []), dtype=complex)

        result = np_tensor_product(A, B)
        return result.tolist()

    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a running task"""
        task = self._active_tasks.get(task_id)
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
            return True
        return False


class QuantumWorkerPool:
    """
    Enhanced pool of quantum workers for concurrent task execution.
    Manages multiple workers with improved task distribution, health monitoring, and metrics.
    """

    def __init__(self, num_workers: int = 4, use_processes: bool = False):
        self.num_workers = num_workers
        self.workers: List[QuantumWorker] = []
        self.use_processes = use_processes
        self._lock = asyncio.Lock()
        self._task_queue: asyncio.Queue = asyncio.Queue()
        self._running = False
        self._worker_tasks: List[asyncio.Task] = []
        
        # Enhanced metrics and health tracking
        self._worker_metrics: Dict[int, Dict[str, Any]] = {}
        self._worker_load: Dict[int, int] = {}  # Track active tasks per worker
        self._total_tasks_completed = 0
        self._total_tasks_failed = 0
        self._worker_health: Dict[int, bool] = {}
        self._current_worker_index = 0  # For round-robin distribution

    async def start(self):
        """Start the worker pool with health monitoring"""
        async with self._lock:
            if self._running:
                return

            self._running = True

            # Create workers
            for i in range(self.num_workers):
                worker = QuantumWorker(use_processes=self.use_processes)
                worker.start()
                self.workers.append(worker)
                
                # Initialize metrics and health tracking
                self._worker_metrics[i] = {
                    "tasks_completed": 0,
                    "tasks_failed": 0,
                    "total_duration": 0.0,
                    "last_task_time": None
                }
                self._worker_load[i] = 0
                self._worker_health[i] = True

            # Start worker tasks
            for i, worker in enumerate(self.workers):
                task = asyncio.create_task(self._worker_loop(worker, i))
                self._worker_tasks.append(task)
            
            # Start health monitoring task
            health_task = asyncio.create_task(self._health_monitor_loop())
            self._worker_tasks.append(health_task)

    async def shutdown(self, wait: bool = True):
        """Shutdown the worker pool"""
        async with self._lock:
            if not self._running:
                return

            self._running = False

            # Shutdown all workers
            shutdown_tasks = [worker.shutdown(wait) for worker in self.workers]
            await asyncio.gather(*shutdown_tasks, return_exceptions=True)

            # Cancel worker tasks
            for task in self._worker_tasks:
                if not task.done():
                    task.cancel()

            if wait:
                await asyncio.gather(*self._worker_tasks, return_exceptions=True)

            self.workers.clear()
            self._worker_tasks.clear()

    def _select_worker(self) -> int:
        """Select best worker using round-robin with load balancing"""
        # Find worker with least load
        min_load = min(self._worker_load.values()) if self._worker_load else 0
        available_workers = [
            i for i, load in self._worker_load.items()
            if load == min_load and self._worker_health.get(i, True)
        ]
        
        if not available_workers:
            # Fallback to round-robin if all workers are unhealthy
            available_workers = list(range(self.num_workers))
        
        # Round-robin selection
        selected = available_workers[self._current_worker_index % len(available_workers)]
        self._current_worker_index = (self._current_worker_index + 1) % len(available_workers)
        return selected
    
    async def submit_task(self, message: WorkerMessage, progress_callback: Optional[Callable[[WorkerResponse], Awaitable[None]]] = None, priority: int = 0) -> asyncio.Future:
        """Submit a task to the pool with optional priority"""
        if not self._running:
            raise RuntimeError("Worker pool is not running")

        future = asyncio.Future()
        # Priority queue would be better, but for now we use simple queue
        await self._task_queue.put((message, progress_callback, future, priority))
        return future
    
    def get_pool_status(self) -> Dict[str, Any]:
        """Get comprehensive pool status"""
        return {
            "running": self._running,
            "num_workers": self.num_workers,
            "active_workers": sum(1 for health in self._worker_health.values() if health),
            "total_tasks_completed": self._total_tasks_completed,
            "total_tasks_failed": self._total_tasks_failed,
            "queue_size": self._task_queue.qsize(),
            "worker_load": dict(self._worker_load),
            "worker_health": dict(self._worker_health),
            "worker_metrics": {
                i: {
                    "tasks_completed": metrics["tasks_completed"],
                    "tasks_failed": metrics["tasks_failed"],
                    "avg_duration": metrics["total_duration"] / max(metrics["tasks_completed"], 1),
                    "current_load": self._worker_load.get(i, 0)
                }
                for i, metrics in self._worker_metrics.items()
            }
        }

    async def _worker_loop(self, worker: QuantumWorker, worker_id: int):
        """Main loop for each worker with enhanced tracking"""
        import time
        try:
            while self._running:
                try:
                    # Get next task with timeout
                    task_data = await asyncio.wait_for(
                        self._task_queue.get(), timeout=1.0
                    )
                    message, progress_callback, future, priority = task_data
                except asyncio.TimeoutError:
                    continue

                # Update worker load
                self._worker_load[worker_id] = self._worker_load.get(worker_id, 0) + 1
                task_start_time = time.time()
                
                try:
                    # Execute the task
                    result = await worker.execute(message, progress_callback)
                    
                    # Update metrics
                    task_duration = time.time() - task_start_time
                    self._worker_metrics[worker_id]["tasks_completed"] += 1
                    self._worker_metrics[worker_id]["total_duration"] += task_duration
                    self._worker_metrics[worker_id]["last_task_time"] = time.time()
                    self._total_tasks_completed += 1
                    self._worker_health[worker_id] = True
                    
                    if not future.cancelled():
                        future.set_result(result)
                except Exception as e:
                    # Update failure metrics
                    self._worker_metrics[worker_id]["tasks_failed"] += 1
                    self._total_tasks_failed += 1
                    
                    # Mark worker as potentially unhealthy after multiple failures
                    if self._worker_metrics[worker_id]["tasks_failed"] > 10:
                        self._worker_health[worker_id] = False
                    
                    if not future.cancelled():
                        future.set_exception(e)
                finally:
                    # Decrease worker load
                    self._worker_load[worker_id] = max(0, self._worker_load.get(worker_id, 0) - 1)
                    self._task_queue.task_done()

        except asyncio.CancelledError:
            pass
        except Exception as e:
            self._worker_health[worker_id] = False
            print(f"Worker {worker_id} error: {e}")
    
    async def _health_monitor_loop(self):
        """Monitor worker health periodically"""
        import time
        while self._running:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                current_time = time.time()
                for worker_id, metrics in self._worker_metrics.items():
                    # Check if worker is responsive
                    last_task_time = metrics.get("last_task_time")
                    if last_task_time and (current_time - last_task_time) > 300:  # 5 minutes
                        # Worker hasn't processed a task in 5 minutes
                        if self._worker_load.get(worker_id, 0) == 0:
                            # Worker is idle but healthy
                            self._worker_health[worker_id] = True
                        else:
                            # Worker has load but no recent activity - potentially stuck
                            self._worker_health[worker_id] = False
                    
                    # Reset health if worker has recovered
                    failure_rate = metrics["tasks_failed"] / max(
                        metrics["tasks_completed"] + metrics["tasks_failed"], 1
                    )
                    if failure_rate < 0.1 and metrics["tasks_completed"] > 0:
                        self._worker_health[worker_id] = True
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Health monitor error: {e}")


# Convenience functions for direct use
async def simulate_circuit_async(circuit: QuantumCircuit, initial_state: Optional[Any] = None,
                                progress_callback: Optional[Callable[[WorkerResponse], Awaitable[None]]] = None) -> Dict[str, Any]:
    """Simulate a circuit asynchronously"""
    async with QuantumWorker() as worker:
        message = WorkerMessage(
            type=WorkerMessageType.SIMULATE,
            id='simulate_task',
            data={'circuit': {'numQubits': circuit.num_qubits, 'gates': circuit.gates}, 'initialState': initial_state}
        )
        response = await worker.execute(message, progress_callback)
        if response.type == 'error':
            raise RuntimeError(response.error)
        return response.data


async def matrix_multiply_async(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    """Matrix multiplication asynchronously"""
    async with QuantumWorker() as worker:
        message = WorkerMessage(
            type=WorkerMessageType.MATRIX_MULTIPLY,
            id='multiply_task',
            data={'A': A.tolist(), 'B': B.tolist()}
        )
        response = await worker.execute(message)
        if response.type == 'error':
            raise RuntimeError(response.error)
        return np.array(response.data)


async def tensor_product_async(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    """Tensor product asynchronously"""
    async with QuantumWorker() as worker:
        message = WorkerMessage(
            type=WorkerMessageType.TENSOR_PRODUCT,
            id='tensor_task',
            data={'A': A.tolist(), 'B': B.tolist()}
        )
        response = await worker.execute(message)
        if response.type == 'error':
            raise RuntimeError(response.error)
        return np.array(response.data)