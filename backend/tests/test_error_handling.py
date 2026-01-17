"""
Tests for error handling system
"""
import pytest
from fastapi.testclient import TestClient
from error_handling import (
    QuantumAPIError,
    CircuitExecutionError,
    IBMQuantumError,
    CacheError,
    WorkerPoolError
)


def test_quantum_api_error():
    """Test QuantumAPIError creation"""
    error = QuantumAPIError("Test error", status_code=400, error_code="TEST_ERROR")
    assert error.message == "Test error"
    assert error.status_code == 400
    assert error.error_code == "TEST_ERROR"


def test_circuit_execution_error():
    """Test CircuitExecutionError"""
    error = CircuitExecutionError("Circuit failed", details={"backend": "local"})
    assert error.status_code == 422
    assert error.error_code == "CIRCUIT_EXECUTION_ERROR"
    assert "backend" in error.details


def test_ibm_quantum_error():
    """Test IBMQuantumError"""
    error = IBMQuantumError("IBM connection failed")
    assert error.status_code == 502
    assert error.error_code == "IBM_QUANTUM_ERROR"


def test_error_response_format(client: TestClient):
    """Test error response format"""
    # This would require a test client setup
    pass
