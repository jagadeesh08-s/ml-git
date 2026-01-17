"""
Tests for worker pool
"""
import pytest
import asyncio
from quantum_worker import QuantumWorker, QuantumWorkerPool, WorkerMessage, WorkerMessageType


@pytest.mark.asyncio
async def test_quantum_worker():
    """Test individual quantum worker"""
    async with QuantumWorker() as worker:
        message = WorkerMessage(
            type=WorkerMessageType.SIMULATE,
            id="test_1",
            data={
                "circuit": {
                    "numQubits": 1,
                    "gates": [{"name": "H", "qubits": [0]}]
                },
                "initialState": "ket0"
            }
        )
        
        response = await worker.execute(message)
        assert response.type == "result"
        assert response.data is not None


@pytest.mark.asyncio
async def test_worker_pool():
    """Test worker pool"""
    pool = QuantumWorkerPool(num_workers=2)
    
    try:
        await pool.start()
        
        # Check pool status
        status = pool.get_pool_status()
        assert status["running"] is True
        assert status["num_workers"] == 2
        assert status["active_workers"] == 2
        
        # Submit a task
        message = WorkerMessage(
            type=WorkerMessageType.SIMULATE,
            id="pool_test_1",
            data={
                "circuit": {
                    "numQubits": 1,
                    "gates": [{"name": "X", "qubits": [0]}]
                }
            }
        )
        
        future = await pool.submit_task(message)
        result = await future
        
        assert result.type == "result"
        
    finally:
        await pool.shutdown()


@pytest.mark.asyncio
async def test_worker_pool_load_balancing():
    """Test worker pool load balancing"""
    pool = QuantumWorkerPool(num_workers=3)
    
    try:
        await pool.start()
        
        # Submit multiple tasks
        tasks = []
        for i in range(5):
            message = WorkerMessage(
                type=WorkerMessageType.SIMULATE,
                id=f"load_test_{i}",
                data={
                    "circuit": {
                        "numQubits": 1,
                        "gates": [{"name": "H", "qubits": [0]}]
                    }
                }
            )
            future = await pool.submit_task(message)
            tasks.append(future)
        
        # Wait for all tasks
        results = await asyncio.gather(*tasks)
        
        # Check that tasks were distributed
        status = pool.get_pool_status()
        assert status["total_tasks_completed"] >= 5
        
    finally:
        await pool.shutdown()
