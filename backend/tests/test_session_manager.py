"""
test_session_manager.py — Pure unit tests for SessionManager and CallSession.
No HTTP, no mocks needed — tests the in-memory logic directly.
"""

import time
import pytest
from unittest.mock import patch

# Env vars must be set before importing main
import os
os.environ.setdefault("OPENAI_API_KEY",      "sk-test")
os.environ.setdefault("SUPABASE_URL",         "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "fake-key")


# We import the classes directly from main (single-file architecture)
import main as m
SessionManager = m.SessionManager
CallSession    = m.CallSession


@pytest.fixture()
def mgr():
    """Fresh SessionManager for each test."""
    return SessionManager()


@pytest.fixture()
def uid():
    import uuid
    return str(uuid.uuid4())


@pytest.fixture()
def sid():
    import uuid
    return str(uuid.uuid4())


# ─── create ──────────────────────────────────────────────────────────────────

class TestCreate:
    def test_creates_session(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        assert isinstance(s, CallSession)

    def test_session_stored(self, mgr, uid, sid):
        mgr.create(sid, uid)
        assert mgr.get(sid) is not None

    def test_user_map_updated(self, mgr, uid, sid):
        mgr.create(sid, uid)
        assert mgr._user_map[uid] == sid

    def test_initial_score_is_65(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        assert s.score == 65

    def test_initial_transcript_empty(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        assert s.transcript == []

    def test_initial_signals_empty(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        assert s.signals == []

    def test_prospect_name_stored(self, mgr, uid, sid):
        s = mgr.create(sid, uid, prospect_name="Jane Doe")
        assert s.prospect_name == "Jane Doe"

    def test_creates_replaces_existing_session(self, mgr, uid):
        import uuid
        sid1 = str(uuid.uuid4())
        sid2 = str(uuid.uuid4())
        mgr.create(sid1, uid)
        mgr.create(sid2, uid)
        # Old session gone, new one active
        assert mgr.get(sid1) is None
        assert mgr.get(sid2) is not None

    def test_two_users_independent(self, mgr):
        import uuid
        uid1, uid2 = str(uuid.uuid4()), str(uuid.uuid4())
        sid1, sid2 = str(uuid.uuid4()), str(uuid.uuid4())
        mgr.create(sid1, uid1)
        mgr.create(sid2, uid2)
        assert len(mgr._sessions) == 2


# ─── get ─────────────────────────────────────────────────────────────────────

class TestGet:
    def test_get_existing(self, mgr, uid, sid):
        mgr.create(sid, uid)
        assert mgr.get(sid) is not None

    def test_get_nonexistent_returns_none(self, mgr):
        assert mgr.get("nonexistent") is None

    def test_get_returns_correct_session(self, mgr, uid, sid):
        mgr.create(sid, uid)
        s = mgr.get(sid)
        assert s.session_id == sid
        assert s.user_id == uid


# ─── end ─────────────────────────────────────────────────────────────────────

class TestEnd:
    def test_end_removes_session(self, mgr, uid, sid):
        mgr.create(sid, uid)
        mgr.end(sid)
        assert mgr.get(sid) is None

    def test_end_removes_user_map_entry(self, mgr, uid, sid):
        mgr.create(sid, uid)
        mgr.end(sid)
        assert uid not in mgr._user_map

    def test_end_returns_session(self, mgr, uid, sid):
        mgr.create(sid, uid)
        s = mgr.end(sid)
        assert s is not None
        assert s.session_id == sid

    def test_end_nonexistent_returns_none(self, mgr):
        assert mgr.end("ghost") is None

    def test_end_decrements_count(self, mgr, uid, sid):
        mgr.create(sid, uid)
        assert len(mgr._sessions) == 1
        mgr.end(sid)
        assert len(mgr._sessions) == 0


# ─── CallSession.duration_seconds ────────────────────────────────────────────

class TestDuration:
    def test_duration_is_integer(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        assert isinstance(s.duration_seconds(), int)

    def test_duration_starts_near_zero(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        assert s.duration_seconds() < 2  # test runs in < 2s

    def test_duration_increases_over_time(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        # Fake the start time 5 seconds in the past
        s.started_at = time.time() - 5
        assert s.duration_seconds() >= 5


# ─── Signal cooldown ─────────────────────────────────────────────────────────

class TestSignalCooldown:
    def test_record_signals_stores_timestamp(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        s.record_signals(["price_objection"])
        assert "price_objection" in s.recent_signals

    def test_cooldown_blocks_recent_signal(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        s.record_signals(["price_objection"])
        keys = s.get_cooldown_keys(30)
        assert "price_objection" in keys

    def test_cooldown_allows_expired_signal(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        s.record_signals(["price_objection"])
        # Fake the timestamp as 60s ago (beyond 30s cooldown)
        s.recent_signals["price_objection"] = time.time() - 60
        keys = s.get_cooldown_keys(30)
        assert "price_objection" not in keys

    def test_different_signal_types_independent(self, mgr, uid, sid):
        s = mgr.create(sid, uid)
        s.record_signals(["price_objection"])
        keys = s.get_cooldown_keys(30)
        assert "close_signal" not in keys


# ─── broadcast (async) ───────────────────────────────────────────────────────

class TestBroadcast:
    @pytest.mark.asyncio
    async def test_broadcast_no_clients_does_not_raise(self, mgr, uid, sid):
        mgr.create(sid, uid)
        # Should not raise even with zero WS clients
        await mgr.broadcast(sid, {"type": "ping", "payload": {}})

    @pytest.mark.asyncio
    async def test_broadcast_removes_dead_clients(self, mgr, uid, sid):
        from unittest.mock import AsyncMock, MagicMock
        mgr.create(sid, uid)
        session = mgr.get(sid)

        # Create a fake WS that raises on send_json (simulates disconnect)
        dead_ws = MagicMock()
        dead_ws.send_json = AsyncMock(side_effect=Exception("disconnected"))
        session.ws_clients.append(dead_ws)

        await mgr.broadcast(sid, {"type": "ping"})
        # Dead client should have been pruned
        assert dead_ws not in session.ws_clients

    @pytest.mark.asyncio
    async def test_broadcast_to_nonexistent_session_silent(self, mgr):
        # Should not raise
        await mgr.broadcast("ghost-session", {"type": "ping"})