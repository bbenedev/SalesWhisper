"""
test_sessions.py — REST API tests for session lifecycle.

Covers:
  POST /api/v1/sessions/start
  GET  /api/v1/sessions/{id}/state
  POST /api/v1/sessions/end
"""

import pytest


# ─── /sessions/start ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_start_session_returns_200(client, fake_user_id):
    resp = await client.post("/api/v1/sessions/start", json={
        "user_id": fake_user_id,
        "prospect_name": "Jane Smith",
        "company": "Acme Corp",
        "platform": "zoom",
    })
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_start_session_returns_session_id(client, fake_user_id):
    data = (await client.post("/api/v1/sessions/start", json={
        "user_id": fake_user_id,
    })).json()
    assert "session_id" in data
    assert len(data["session_id"]) == 36  # UUID format


@pytest.mark.asyncio
async def test_start_session_returns_ws_url(client, fake_user_id):
    data = (await client.post("/api/v1/sessions/start", json={
        "user_id": fake_user_id,
    })).json()
    assert "ws_url" in data
    assert data["ws_url"].startswith("ws://")
    assert data["session_id"] in data["ws_url"]
    assert fake_user_id in data["ws_url"]


@pytest.mark.asyncio
async def test_start_session_increments_active_count(client, fake_user_id):
    before = (await client.get("/health")).json()["active_sessions"]
    await client.post("/api/v1/sessions/start", json={"user_id": fake_user_id})
    after = (await client.get("/health")).json()["active_sessions"]
    assert after == before + 1


@pytest.mark.asyncio
async def test_start_session_replaces_existing_for_same_user(client, fake_user_id):
    """Same user starting a second session should not create two sessions."""
    await client.post("/api/v1/sessions/start", json={"user_id": fake_user_id})
    await client.post("/api/v1/sessions/start", json={"user_id": fake_user_id})
    data = (await client.get("/health")).json()
    assert data["active_sessions"] == 1


@pytest.mark.asyncio
async def test_start_session_without_prospect_is_ok(client, fake_user_id):
    """prospect_name and company are optional."""
    resp = await client.post("/api/v1/sessions/start", json={
        "user_id": fake_user_id,
    })
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_start_session_requires_user_id(client):
    resp = await client.post("/api/v1/sessions/start", json={})
    assert resp.status_code == 422


# ─── /sessions/{id}/state ────────────────────────────────────────────────────

@pytest.fixture()
async def active_session(client, fake_user_id):
    """Start a session and return (session_id, user_id)."""
    data = (await client.post("/api/v1/sessions/start", json={
        "user_id": fake_user_id,
        "prospect_name": "Test Prospect",
    })).json()
    return data["session_id"], fake_user_id


@pytest.mark.asyncio
async def test_get_state_returns_200(client, active_session):
    session_id, user_id = active_session
    resp = await client.get(
        f"/api/v1/sessions/{session_id}/state",
        params={"user_id": user_id},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_get_state_initial_fields(client, active_session):
    session_id, user_id = active_session
    data = (await client.get(
        f"/api/v1/sessions/{session_id}/state",
        params={"user_id": user_id},
    )).json()
    assert data["session_id"] == session_id
    assert isinstance(data["score"], int)
    assert isinstance(data["signals"], list)
    assert isinstance(data["transcript"], list)
    assert isinstance(data["suggestions"], list)
    assert data["chunk_count"] == 0


@pytest.mark.asyncio
async def test_get_state_initial_score_is_65(client, active_session):
    """Default starting score defined in SessionManager."""
    session_id, user_id = active_session
    data = (await client.get(
        f"/api/v1/sessions/{session_id}/state",
        params={"user_id": user_id},
    )).json()
    assert data["score"] == 65


@pytest.mark.asyncio
async def test_get_state_wrong_user_returns_404(client, active_session):
    session_id, _ = active_session
    resp = await client.get(
        f"/api/v1/sessions/{session_id}/state",
        params={"user_id": "wrong-user-id"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_state_nonexistent_session_returns_404(client, fake_user_id):
    resp = await client.get(
        "/api/v1/sessions/00000000-0000-0000-0000-000000000000/state",
        params={"user_id": fake_user_id},
    )
    assert resp.status_code == 404


# ─── /sessions/end ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_end_session_returns_200(client, active_session):
    session_id, user_id = active_session
    resp = await client.post("/api/v1/sessions/end", json={
        "session_id": session_id,
        "user_id": user_id,
    })
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_end_session_returns_ok_true(client, active_session):
    session_id, user_id = active_session
    data = (await client.post("/api/v1/sessions/end", json={
        "session_id": session_id,
        "user_id": user_id,
    })).json()
    assert data["ok"] is True


@pytest.mark.asyncio
async def test_end_session_returns_summary(client, active_session):
    session_id, user_id = active_session
    data = (await client.post("/api/v1/sessions/end", json={
        "session_id": session_id,
        "user_id": user_id,
    })).json()
    assert "summary" in data
    assert "ai_summary" in data["summary"]
    assert isinstance(data["summary"]["next_steps"], list)
    assert isinstance(data["summary"]["areas_to_improve"], list)


@pytest.mark.asyncio
async def test_end_session_decrements_active_count(client, fake_user_id):
    start = (await client.post("/api/v1/sessions/start", json={
        "user_id": fake_user_id,
    })).json()
    session_id = start["session_id"]

    before = (await client.get("/health")).json()["active_sessions"]
    await client.post("/api/v1/sessions/end", json={
        "session_id": session_id,
        "user_id": fake_user_id,
    })
    after = (await client.get("/health")).json()["active_sessions"]
    assert after == before - 1


@pytest.mark.asyncio
async def test_end_session_wrong_user_returns_404(client, active_session):
    session_id, _ = active_session
    resp = await client.post("/api/v1/sessions/end", json={
        "session_id": session_id,
        "user_id": "wrong-user",
    })
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_end_session_nonexistent_returns_404(client, fake_user_id):
    resp = await client.post("/api/v1/sessions/end", json={
        "session_id": "00000000-0000-0000-0000-000000000000",
        "user_id": fake_user_id,
    })
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_end_session_state_unreachable_after_end(client, active_session):
    """After ending, the session should no longer be queryable."""
    session_id, user_id = active_session
    await client.post("/api/v1/sessions/end", json={
        "session_id": session_id,
        "user_id": user_id,
    })
    resp = await client.get(
        f"/api/v1/sessions/{session_id}/state",
        params={"user_id": user_id},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_end_session_requires_both_fields(client):
    resp = await client.post("/api/v1/sessions/end", json={"session_id": "x"})
    assert resp.status_code == 422