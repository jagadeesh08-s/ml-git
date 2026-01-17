"""
SQLAlchemy database models for Quantum Backend
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from database import Base
import json


class CircuitExecution(Base):
    """Model for storing quantum circuit executions"""
    __tablename__ = "circuit_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(36), unique=True, index=True, nullable=False)
    
    # Circuit information
    num_qubits = Column(Integer, nullable=False)
    num_gates = Column(Integer, nullable=False)
    circuit_data = Column(JSON, nullable=False)  # Full circuit definition
    
    # Execution details
    backend = Column(String(50), nullable=False, index=True)
    shots = Column(Integer, default=1024)
    initial_state = Column(String(20), default="ket0")
    
    # Results
    success = Column(Boolean, default=False, index=True)
    execution_time = Column(Float, nullable=False)
    method = Column(String(50))
    result_data = Column(JSON)  # Full result data
    error_message = Column(Text)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_backend_created', 'backend', 'created_at'),
        Index('idx_success_created', 'success', 'created_at'),
    )
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "request_id": self.request_id,
            "num_qubits": self.num_qubits,
            "num_gates": self.num_gates,
            "circuit_data": self.circuit_data,
            "backend": self.backend,
            "shots": self.shots,
            "initial_state": self.initial_state,
            "success": self.success,
            "execution_time": self.execution_time,
            "method": self.method,
            "result_data": self.result_data,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class IBMJob(Base):
    """Model for storing IBM Quantum job information"""
    __tablename__ = "ibm_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(100), unique=True, index=True, nullable=False)
    
    # Job details
    backend = Column(String(50), nullable=False, index=True)
    shots = Column(Integer, default=1024)
    circuit_data = Column(JSON, nullable=False)
    
    # Status tracking
    status = Column(String(20), default="QUEUED", index=True)
    status_message = Column(String(200))
    progress = Column(Float, default=0.0)
    
    # Results
    result_data = Column(JSON)
    error_message = Column(Text)
    
    # Timing
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True))
    estimated_time = Column(Float)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Indexes
    __table_args__ = (
        Index('idx_status_backend', 'status', 'backend'),
        Index('idx_submitted_at', 'submitted_at'),
    )
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "job_id": self.job_id,
            "backend": self.backend,
            "shots": self.shots,
            "circuit_data": self.circuit_data,
            "status": self.status,
            "status_message": self.status_message,
            "progress": self.progress,
            "result_data": self.result_data,
            "error_message": self.error_message,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "estimated_time": self.estimated_time,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class AIQuestion(Base):
    """Model for storing AI questions and responses"""
    __tablename__ = "ai_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question_hash = Column(String(64), unique=True, index=True, nullable=False)
    
    # Question and answer
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    accessed_at = Column(DateTime(timezone=True), server_default=func.now())
    access_count = Column(Integer, default=1)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "question_hash": self.question_hash,
            "question": self.question,
            "answer": self.answer,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "accessed_at": self.accessed_at.isoformat() if self.accessed_at else None,
            "access_count": self.access_count
        }


class WorkerTask(Base):
    """Model for tracking worker pool tasks"""
    __tablename__ = "worker_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(100), unique=True, index=True, nullable=False)
    
    # Task details
    task_type = Column(String(50), nullable=False, index=True)
    status = Column(String(20), default="PENDING", index=True)  # PENDING, RUNNING, COMPLETED, FAILED
    
    # Task data
    input_data = Column(JSON)
    output_data = Column(JSON)
    error_message = Column(Text)
    
    # Worker information
    worker_id = Column(String(50), index=True)
    
    # Timing
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    duration = Column(Float)
    
    # Indexes
    __table_args__ = (
        Index('idx_status_type', 'status', 'task_type'),
        Index('idx_created_at', 'created_at'),
    )
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "task_id": self.task_id,
            "task_type": self.task_type,
            "status": self.status,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "error_message": self.error_message,
            "worker_id": self.worker_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration": self.duration
        }


class SystemMetrics(Base):
    """Model for storing system metrics over time"""
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Metric details
    metric_name = Column(String(50), nullable=False, index=True)
    metric_value = Column(Float, nullable=False)
    metric_type = Column(String(20), default="gauge")  # gauge, counter, histogram
    
    # Labels/tags
    labels = Column(JSON)
    
    # Timestamp
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Indexes
    __table_args__ = (
        Index('idx_metric_recorded', 'metric_name', 'recorded_at'),
    )
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "metric_name": self.metric_name,
            "metric_value": self.metric_value,
            "metric_type": self.metric_type,
            "labels": self.labels,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None
        }
