"""
API v2 Routes (Current version)
"""
from fastapi import APIRouter, Request
from typing import Dict, Any
from api_versioning import create_versioned_router

# Create v2 router
v2_router = create_versioned_router("v2")

@v2_router.get("/status")
async def v2_status():
    """V2 status endpoint"""
    return {
        "version": "v2",
        "status": "active",
        "features": [
            "Enhanced error handling",
            "Database persistence",
            "Worker pool improvements",
            "Comprehensive monitoring"
        ]
    }
