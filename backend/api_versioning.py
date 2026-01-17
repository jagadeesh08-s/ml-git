"""
API Versioning System
"""
from fastapi import APIRouter, Request, Header
from typing import Optional
from enum import Enum
from datetime import datetime
import re


class APIVersion(str, Enum):
    """Supported API versions"""
    V1 = "v1"
    V2 = "v2"
    LATEST = "v2"  # Current latest version


def get_api_version(accept_header: Optional[str] = None, x_api_version: Optional[str] = None) -> str:
    """
    Extract API version from request headers
    
    Priority:
    1. X-API-Version header
    2. Accept header (e.g., application/vnd.quantum.v2+json)
    3. Default to latest version
    """
    # Check X-API-Version header first
    if x_api_version:
        version = x_api_version.lower().strip()
        if version.startswith("v"):
            version = version[1:]
        try:
            # Validate version format
            if re.match(r'^\d+$', version):
                return f"v{version}"
        except:
            pass
    
    # Check Accept header
    if accept_header:
        # Look for version in Accept header: application/vnd.quantum.v2+json
        match = re.search(r'vnd\.quantum\.v(\d+)', accept_header, re.IGNORECASE)
        if match:
            return f"v{match.group(1)}"
    
    # Default to latest
    return APIVersion.LATEST.value


def create_versioned_router(version: str) -> APIRouter:
    """Create a versioned API router"""
    return APIRouter(
        prefix=f"/api/{version}",
        tags=[f"API {version.upper()}"],
        responses={
            404: {"description": "Not found"},
            422: {"description": "Validation error"},
            500: {"description": "Internal server error"}
        }
    )


class VersionedRouter:
    """Helper class for managing versioned routes"""
    
    def __init__(self):
        self.routers: dict[str, APIRouter] = {}
        self.deprecated_versions: set[str] = set()
    
    def register_version(self, version: str, router: APIRouter, deprecated: bool = False):
        """Register a version router"""
        self.routers[version] = router
        if deprecated:
            self.deprecated_versions.add(version)
    
    def get_router(self, version: str) -> Optional[APIRouter]:
        """Get router for a specific version"""
        return self.routers.get(version)
    
    def is_deprecated(self, version: str) -> bool:
        """Check if version is deprecated"""
        return version in self.deprecated_versions
    
    def get_all_versions(self) -> list[str]:
        """Get all registered versions"""
        return list(self.routers.keys())
    
    def get_latest_version(self) -> str:
        """Get latest version"""
        versions = sorted(self.get_all_versions(), reverse=True)
        return versions[0] if versions else APIVersion.LATEST.value


# Global versioned router manager
versioned_router = VersionedRouter()


def version_deprecated(version: str, sunset_date: Optional[str] = None, replacement: Optional[str] = None):
    """
    Decorator to mark an endpoint as deprecated
    
    Args:
        version: The deprecated version
        sunset_date: Date when version will be removed (YYYY-MM-DD)
        replacement: Replacement version
    """
    def decorator(func):
        func._deprecated_version = version
        func._sunset_date = sunset_date
        func._replacement_version = replacement
        return func
    return decorator


async def version_middleware(request: Request, call_next):
    """Middleware to handle API versioning"""
    # Extract version from headers
    accept_header = request.headers.get("Accept", "")
    x_api_version = request.headers.get("X-API-Version", "")
    
    version = get_api_version(accept_header, x_api_version)
    
    # Store version in request state
    request.state.api_version = version
    
    # Check if version is deprecated
    if versioned_router.is_deprecated(version):
        sunset_info = {
            "deprecated": True,
            "version": version,
            "message": f"API version {version} is deprecated",
            "latest_version": versioned_router.get_latest_version()
        }
        # Add to response headers
        response = await call_next(request)
        response.headers["X-API-Deprecated"] = "true"
        response.headers["X-API-Version"] = version
        response.headers["X-API-Latest-Version"] = versioned_router.get_latest_version()
        response.headers["Warning"] = f'299 - "API version {version} is deprecated"'
        return response
    
    # Add version headers to response
    response = await call_next(request)
    response.headers["X-API-Version"] = version
    response.headers["X-API-Latest-Version"] = versioned_router.get_latest_version()
    
    return response
