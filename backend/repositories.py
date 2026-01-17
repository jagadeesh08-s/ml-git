"""
Repository pattern for database access
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, desc, and_, Integer
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
import hashlib
import uuid

from db_models import (
    CircuitExecution, IBMJob, AIQuestion, WorkerTask, SystemMetrics
)
from error_handling import QuantumAPIError


class CircuitExecutionRepository:
    """Repository for circuit execution records"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(
        self,
        circuit_data: Dict[str, Any],
        backend: str,
        shots: int,
        initial_state: str,
        success: bool,
        execution_time: float,
        method: Optional[str] = None,
        result_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> CircuitExecution:
        """Create a new circuit execution record"""
        execution = CircuitExecution(
            request_id=str(uuid.uuid4()),
            num_qubits=circuit_data.get("numQubits", 0),
            num_gates=len(circuit_data.get("gates", [])),
            circuit_data=circuit_data,
            backend=backend,
            shots=shots,
            initial_state=initial_state,
            success=success,
            execution_time=execution_time,
            method=method,
            result_data=result_data,
            error_message=error_message
        )
        
        self.session.add(execution)
        await self.session.commit()
        await self.session.refresh(execution)
        return execution
    
    async def get_by_id(self, execution_id: int) -> Optional[CircuitExecution]:
        """Get execution by ID"""
        result = await self.session.execute(
            select(CircuitExecution).where(CircuitExecution.id == execution_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_request_id(self, request_id: str) -> Optional[CircuitExecution]:
        """Get execution by request ID"""
        result = await self.session.execute(
            select(CircuitExecution).where(CircuitExecution.request_id == request_id)
        )
        return result.scalar_one_or_none()
    
    async def list(
        self,
        backend: Optional[str] = None,
        success: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[CircuitExecution]:
        """List executions with filters"""
        query = select(CircuitExecution)
        
        conditions = []
        if backend:
            conditions.append(CircuitExecution.backend == backend)
        if success is not None:
            conditions.append(CircuitExecution.success == success)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        query = query.order_by(desc(CircuitExecution.created_at)).limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_statistics(
        self,
        backend: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get execution statistics"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = select(
            func.count(CircuitExecution.id).label("total"),
            func.avg(CircuitExecution.execution_time).label("avg_time"),
            func.sum(CircuitExecution.success.cast(Integer)).label("success_count")
        ).where(CircuitExecution.created_at >= cutoff_date)
        
        if backend:
            query = query.where(CircuitExecution.backend == backend)
        
        result = await self.session.execute(query)
        row = result.first()
        
        return {
            "total_executions": row.total or 0,
            "success_count": row.success_count or 0,
            "failure_count": (row.total or 0) - (row.success_count or 0),
            "average_execution_time": float(row.avg_time) if row.avg_time else 0.0,
            "success_rate": (row.success_count or 0) / (row.total or 1) * 100
        }


class IBMJobRepository:
    """Repository for IBM Quantum jobs"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(
        self,
        job_id: str,
        backend: str,
        shots: int,
        circuit_data: Dict[str, Any],
        status: str = "QUEUED"
    ) -> IBMJob:
        """Create a new IBM job record"""
        job = IBMJob(
            job_id=job_id,
            backend=backend,
            shots=shots,
            circuit_data=circuit_data,
            status=status
        )
        
        self.session.add(job)
        await self.session.commit()
        await self.session.refresh(job)
        return job
    
    async def get_by_job_id(self, job_id: str) -> Optional[IBMJob]:
        """Get job by IBM job ID"""
        result = await self.session.execute(
            select(IBMJob).where(IBMJob.job_id == job_id)
        )
        return result.scalar_one_or_none()
    
    async def update_status(
        self,
        job_id: str,
        status: str,
        status_message: Optional[str] = None,
        progress: Optional[float] = None,
        result_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> Optional[IBMJob]:
        """Update job status"""
        job = await self.get_by_job_id(job_id)
        if not job:
            return None
        
        job.status = status
        if status_message:
            job.status_message = status_message
        if progress is not None:
            job.progress = progress
        if result_data:
            job.result_data = result_data
        if error_message:
            job.error_message = error_message
        
        if status in ["COMPLETED", "FAILED", "CANCELLED"]:
            job.completed_at = datetime.utcnow()
        
        await self.session.commit()
        await self.session.refresh(job)
        return job
    
    async def list(
        self,
        backend: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[IBMJob]:
        """List jobs with filters"""
        query = select(IBMJob)
        
        conditions = []
        if backend:
            conditions.append(IBMJob.backend == backend)
        if status:
            conditions.append(IBMJob.status == status)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        query = query.order_by(desc(IBMJob.submitted_at)).limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())


class AIQuestionRepository:
    """Repository for AI questions"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _hash_question(self, question: str) -> str:
        """Generate hash for question"""
        return hashlib.sha256(question.encode()).hexdigest()
    
    async def get_by_question(self, question: str) -> Optional[AIQuestion]:
        """Get answer by question"""
        question_hash = self._hash_question(question)
        result = await self.session.execute(
            select(AIQuestion).where(AIQuestion.question_hash == question_hash)
        )
        return result.scalar_one_or_none()
    
    async def create_or_update(
        self,
        question: str,
        answer: str
    ) -> AIQuestion:
        """Create or update AI question/answer"""
        question_hash = self._hash_question(question)
        
        existing = await self.get_by_question(question)
        if existing:
            existing.answer = answer
            existing.accessed_at = datetime.utcnow()
            existing.access_count += 1
            await self.session.commit()
            await self.session.refresh(existing)
            return existing
        
        ai_question = AIQuestion(
            question_hash=question_hash,
            question=question,
            answer=answer
        )
        
        self.session.add(ai_question)
        await self.session.commit()
        await self.session.refresh(ai_question)
        return ai_question
    
    async def list_popular(
        self,
        limit: int = 20
    ) -> List[AIQuestion]:
        """List most popular questions"""
        query = select(AIQuestion).order_by(
            desc(AIQuestion.access_count)
        ).limit(limit)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())


class WorkerTaskRepository:
    """Repository for worker tasks"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(
        self,
        task_id: str,
        task_type: str,
        input_data: Optional[Dict[str, Any]] = None
    ) -> WorkerTask:
        """Create a new worker task"""
        task = WorkerTask(
            task_id=task_id,
            task_type=task_type,
            input_data=input_data,
            status="PENDING"
        )
        
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task
    
    async def get_by_task_id(self, task_id: str) -> Optional[WorkerTask]:
        """Get task by ID"""
        result = await self.session.execute(
            select(WorkerTask).where(WorkerTask.task_id == task_id)
        )
        return result.scalar_one_or_none()
    
    async def update_status(
        self,
        task_id: str,
        status: str,
        worker_id: Optional[str] = None,
        output_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> Optional[WorkerTask]:
        """Update task status"""
        task = await self.get_by_task_id(task_id)
        if not task:
            return None
        
        task.status = status
        if worker_id:
            task.worker_id = worker_id
        if output_data:
            task.output_data = output_data
        if error_message:
            task.error_message = error_message
        
        if status == "RUNNING" and not task.started_at:
            task.started_at = datetime.utcnow()
        elif status in ["COMPLETED", "FAILED"]:
            task.completed_at = datetime.utcnow()
            if task.started_at:
                task.duration = (task.completed_at - task.started_at).total_seconds()
        
        await self.session.commit()
        await self.session.refresh(task)
        return task
    
    async def list_by_status(
        self,
        status: str,
        limit: int = 100
    ) -> List[WorkerTask]:
        """List tasks by status"""
        query = select(WorkerTask).where(
            WorkerTask.status == status
        ).order_by(desc(WorkerTask.created_at)).limit(limit)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())


class SystemMetricsRepository:
    """Repository for system metrics"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def record(
        self,
        metric_name: str,
        metric_value: float,
        metric_type: str = "gauge",
        labels: Optional[Dict[str, Any]] = None
    ) -> SystemMetrics:
        """Record a system metric"""
        metric = SystemMetrics(
            metric_name=metric_name,
            metric_value=metric_value,
            metric_type=metric_type,
            labels=labels or {}
        )
        
        self.session.add(metric)
        await self.session.commit()
        await self.session.refresh(metric)
        return metric
    
    async def get_latest(
        self,
        metric_name: str,
        labels: Optional[Dict[str, Any]] = None
    ) -> Optional[SystemMetrics]:
        """Get latest metric value"""
        query = select(SystemMetrics).where(
            SystemMetrics.metric_name == metric_name
        ).order_by(desc(SystemMetrics.recorded_at)).limit(1)
        
        if labels:
            # Filter by labels (simplified - would need JSON query for production)
            pass
        
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_time_series(
        self,
        metric_name: str,
        hours: int = 24,
        limit: int = 1000
    ) -> List[SystemMetrics]:
        """Get time series data for a metric"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        query = select(SystemMetrics).where(
            and_(
                SystemMetrics.metric_name == metric_name,
                SystemMetrics.recorded_at >= cutoff_time
            )
        ).order_by(SystemMetrics.recorded_at).limit(limit)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
