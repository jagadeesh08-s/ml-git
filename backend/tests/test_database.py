"""
Tests for database layer
"""
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from database import Base, init_database, get_session
from db_models import CircuitExecution, IBMJob
from repositories import CircuitExecutionRepository, IBMJobRepository


@pytest.fixture
async def db_session():
    """Create test database session"""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        yield session
    
    await engine.dispose()


@pytest.mark.asyncio
async def test_circuit_execution_repository(db_session):
    """Test circuit execution repository"""
    repo = CircuitExecutionRepository(db_session)
    
    circuit_data = {
        "numQubits": 2,
        "gates": [{"name": "H", "qubits": [0]}]
    }
    
    execution = await repo.create(
        circuit_data=circuit_data,
        backend="local",
        shots=1024,
        initial_state="ket0",
        success=True,
        execution_time=0.5,
        method="local_simulator"
    )
    
    assert execution.id is not None
    assert execution.backend == "local"
    assert execution.success is True
    
    # Test retrieval
    retrieved = await repo.get_by_id(execution.id)
    assert retrieved is not None
    assert retrieved.id == execution.id


@pytest.mark.asyncio
async def test_ibm_job_repository(db_session):
    """Test IBM job repository"""
    repo = IBMJobRepository(db_session)
    
    job = await repo.create(
        job_id="test_job_123",
        backend="ibmq_manila",
        shots=1024,
        circuit_data={"numQubits": 2, "gates": []},
        status="QUEUED"
    )
    
    assert job.job_id == "test_job_123"
    assert job.status == "QUEUED"
    
    # Test status update
    updated = await repo.update_status(
        job_id="test_job_123",
        status="COMPLETED",
        progress=100.0,
        result_data={"counts": {"00": 512, "11": 512}}
    )
    
    assert updated.status == "COMPLETED"
    assert updated.progress == 100.0
    assert updated.completed_at is not None
