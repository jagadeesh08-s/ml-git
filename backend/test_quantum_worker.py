#!/usr/bin/env python3
"""
Test script for quantum_worker.py
"""

import asyncio
import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from quantum_worker import QuantumWorker, WorkerMessage, WorkerMessageType
from circuit_operations import QuantumCircuit, QuantumGate


async def test_basic_simulation():
    """Test basic circuit simulation"""
    print("Testing basic circuit simulation...")

    # Create a simple Bell state circuit
    circuit = QuantumCircuit(
        num_qubits=2,
        gates=[
            QuantumGate(name='H', qubits=[0]),
            QuantumGate(name='CNOT', qubits=[0, 1])
        ]
    )

    async with QuantumWorker() as worker:
        message = WorkerMessage(
            type=WorkerMessageType.SIMULATE,
            id='test_simulate',
            data={'circuit': {'numQubits': circuit.num_qubits, 'gates': circuit.gates}}
        )

        response = await worker.execute(message)

        if response.type == 'error':
            print(f"Error: {response.error}")
            return False

        result = response.data
        print("Simulation successful!")
        print(f"Probabilities: {result['probabilities']}")
        print(f"Statevector shape: {len(result['statevector'])}")
        return True


async def test_matrix_operations():
    """Test matrix operations"""
    print("Testing matrix operations...")

    import numpy as np

    A = np.array([[1, 2], [3, 4]], dtype=complex)
    B = np.array([[5, 6], [7, 8]], dtype=complex)

    async with QuantumWorker() as worker:
        # Test matrix multiply
        message = WorkerMessage(
            type=WorkerMessageType.MATRIX_MULTIPLY,
            id='test_multiply',
            data={'A': A.tolist(), 'B': B.tolist()}
        )

        response = await worker.execute(message)
        if response.type == 'error':
            print(f"Multiply error: {response.error}")
            return False

        result = np.array(response.data)
        expected = np.dot(A, B)

        if np.allclose(result, expected):
            print("Matrix multiply test passed!")
        else:
            print("Matrix multiply test failed!")
            return False

        # Test tensor product
        message = WorkerMessage(
            type=WorkerMessageType.TENSOR_PRODUCT,
            id='test_tensor',
            data={'A': A.tolist(), 'B': B.tolist()}
        )

        response = await worker.execute(message)
        if response.type == 'error':
            print(f"Tensor product error: {response.error}")
            return False

        result = np.array(response.data)
        expected = np.kron(A, B)

        if np.allclose(result, expected):
            print("Tensor product test passed!")
        else:
            print("Tensor product test failed!")
            return False

    return True


async def test_worker_pool():
    """Test worker pool"""
    print("Testing worker pool...")

    from quantum_worker import QuantumWorkerPool

    circuit = QuantumCircuit(
        num_qubits=2,
        gates=[QuantumGate(name='H', qubits=[0])]
    )

    pool = QuantumWorkerPool(num_workers=2)
    await pool.start()

    try:
        # Submit multiple tasks
        tasks = []
        for i in range(3):
            message = WorkerMessage(
                type=WorkerMessageType.SIMULATE,
                id=f'pool_test_{i}',
                data={'circuit': {'numQubits': circuit.num_qubits, 'gates': circuit.gates}}
            )
            future = await pool.submit_task(message)
            tasks.append(future)

        # Wait for results
        results = await asyncio.gather(*tasks)

        success_count = sum(1 for r in results if r.type == 'result')
        print(f"Worker pool test: {success_count}/{len(tasks)} tasks successful")

        return success_count == len(tasks)

    finally:
        await pool.shutdown()


async def main():
    """Run all tests"""
    print("Starting quantum worker tests...\n")

    tests = [
        ("Basic Simulation", test_basic_simulation),
        ("Matrix Operations", test_matrix_operations),
        ("Worker Pool", test_worker_pool)
    ]

    passed = 0
    total = len(tests)

    for name, test_func in tests:
        try:
            if await test_func():
                print(f"✓ {name} PASSED\n")
                passed += 1
            else:
                print(f"✗ {name} FAILED\n")
        except Exception as e:
            print(f"✗ {name} ERROR: {e}\n")

    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("All tests passed! ✓")
        return 0
    else:
        print("Some tests failed! ✗")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)