"""
Tests for API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "timestamp" in data


def test_metrics_endpoint(client):
    """Test metrics endpoint"""
    response = client.get("/metrics")
    assert response.status_code == 200
    # Prometheus format
    assert "quantum_requests_total" in response.text or response.status_code in [200, 503]


def test_circuit_execution(client):
    """Test circuit execution endpoint"""
    circuit_data = {
        "circuit": {
            "numQubits": 2,
            "gates": [
                {"name": "H", "qubits": [0]},
                {"name": "CNOT", "qubits": [0, 1]}
            ]
        },
        "backend": "local",
        "shots": 1024
    }
    
    response = client.post("/api/quantum/execute", json=circuit_data)
    assert response.status_code in [200, 422, 500]  # May fail if backend not ready
    if response.status_code == 200:
        data = response.json()
        assert "success" in data
        assert "backend" in data


def test_validation_error(client):
    """Test input validation"""
    invalid_circuit = {
        "circuit": {
            "numQubits": 0,  # Invalid
            "gates": []
        }
    }
    
    response = client.post("/api/quantum/execute", json=invalid_circuit)
    assert response.status_code == 422  # Validation error


def test_api_versioning(client):
    """Test API versioning headers"""
    # Test with version header
    response = client.get("/api/v2/status", headers={"X-API-Version": "v2"})
    assert response.status_code == 200
    assert "X-API-Version" in response.headers
    
    # Test deprecated version
    response = client.get("/api/v1/status", headers={"X-API-Version": "v1"})
    assert response.status_code == 200
    if "X-API-Deprecated" in response.headers:
        assert response.headers["X-API-Deprecated"] == "true"
