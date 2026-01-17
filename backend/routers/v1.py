"""
API v1 Routes (Legacy compatibility)
"""
from fastapi import APIRouter, Depends
from typing import Dict, Any
from api_versioning import create_versioned_router

# Create v1 router
v1_router = create_versioned_router("v1")

# Note: v1 routes are handled by main app for backward compatibility
# This router can be used for v1-specific endpoints if needed

@v1_router.get("/status")
async def v1_status():
    """V1 status endpoint"""
    return {
        "version": "v1",
        "status": "active",
        "deprecated": True,
        "message": "API v1 is deprecated. Please migrate to v2."
    }
