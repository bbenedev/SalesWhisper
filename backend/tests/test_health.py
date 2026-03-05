"""
test_health.py — Basic smoke tests: app boots, health endpoint responds.
These run first and validate the environment is working before deeper tests.
"""

import pytest


@pytest.mark.asyncio
async def test_health_returns_200(client):
    resp = await client.get("/health")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_health_returns_ok(client):
    data = resp = await client.get("/health")
    data = resp.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_health_includes_active_sessions(client):
    data = (await client.get("/health")).json()
    assert "active_sessions" in data
    assert isinstance(data["active_sessions"], int)


@pytest.mark.asyncio
async def test_health_active_sessions_starts_at_zero(client):
    """Fresh test client — no sessions should be active."""
    data = (await client.get("/health")).json()
    assert data["active_sessions"] == 0


@pytest.mark.asyncio
async def test_docs_available_in_dev(client):
    """OpenAPI docs should be accessible in development mode."""
    resp = await client.get("/docs")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_unknown_route_returns_404(client):
    resp = await client.get("/api/v1/nonexistent")
    assert resp.status_code == 404