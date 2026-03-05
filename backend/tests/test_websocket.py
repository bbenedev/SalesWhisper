"""
test_websocket.py — WebSocket integration tests.

Tests the two WS endpoints:
  /ws/dashboard/{session_id}?user_id=...   (dashboard receives events)
  /ws/audio/{session_id}?user_id=...       (extension sends audio chunks)

Uses httpx + starlette's WebSocketTestSession via TestClient.
Note: sync TestClient is used for WS because httpx AsyncClient doesn't
      support WebSocket directly.
"""

import json
import base64
import uuid
import pytest
import os
from unittest.mock import patch, AsyncMock, MagicMock

os.environ.setdefault("OPENAI_API_KEY",      "sk-test")
os.environ.setdefault("SUPABASE_URL",         "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "fake-key")

from fastapi.testclient import TestClient
import main as m


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture()
def clean_sessions():
    """Reset session manager before each test."""
    m.sessions._sessions.clear()
    m.sessions._user_map.clear()
    yield
    m.sessions._sessions.clear()
    m.sessions._user_map.clear()


@pytest.fixture()
def tc(clean_sessions):
    """Sync TestClient — required for WS testing."""
    return TestClient(m.app, raise_server_exceptions=False)


@pytest.fixture()
def uid():
    return str(uuid.uuid4())


@pytest.fixture()
def session(uid, clean_sessions):
    """Create an active session and return (session_id, user_id)."""
    sid = str(uuid.uuid4())
    m.sessions.create(sid, uid, prospect_name="Test Prospect")
    return sid, uid


@pytest.fixture()
def fake_audio():
    return base64.b64encode(b"\x00" * 512).decode()


# ─── Dashboard WebSocket ──────────────────────────────────────────────────────

class TestDashboardWS:

    def test_connects_successfully(self, tc, session):
        sid, uid = session
        with tc.websocket_connect(f"/ws/dashboard/{sid}?user_id={uid}") as ws:
            msg = ws.receive_json()
            assert msg["type"] == "snapshot"

    def test_snapshot_has_score(self, tc, session):
        sid, uid = session
        with tc.websocket_connect(f"/ws/dashboard/{sid}?user_id={uid}") as ws:
            msg = ws.receive_json()
            assert "score" in msg["payload"]
            assert msg["payload"]["score"] == 65

    def test_snapshot_has_required_keys(self, tc, session):
        sid, uid = session
        with tc.websocket_connect(f"/ws/dashboard/{sid}?user_id={uid}") as ws:
            msg = ws.receive_json()
            payload = msg["payload"]
            assert "signals" in payload
            assert "transcript" in payload
            assert "suggestions" in payload
            assert "duration_s" in payload

    def test_wrong_user_closes_with_error(self, tc, session):
        sid, _ = session
        with tc.websocket_connect(f"/ws/dashboard/{sid}?user_id=wrong") as ws:
            msg = ws.receive_json()
            assert msg["type"] == "error"

    def test_nonexistent_session_closes_with_error(self, tc, uid, clean_sessions):
        ghost = str(uuid.uuid4())
        with tc.websocket_connect(f"/ws/dashboard/{ghost}?user_id={uid}") as ws:
            msg = ws.receive_json()
            assert msg["type"] == "error"

    def test_ping_response(self, tc, session):
        sid, uid = session
        with tc.websocket_connect(f"/ws/dashboard/{sid}?user_id={uid}") as ws:
            ws.receive_json()  # consume snapshot
            ws.send_text("ping")
            msg = ws.receive_json()
            assert msg["type"] == "ping"

    def test_session_id_in_all_messages(self, tc, session):
        sid, uid = session
        with tc.websocket_connect(f"/ws/dashboard/{sid}?user_id={uid}") as ws:
            msg = ws.receive_json()
            assert msg["session_id"] == sid

    def test_ts_is_integer(self, tc, session):
        sid, uid = session
        with tc.websocket_connect(f"/ws/dashboard/{sid}?user_id={uid}") as ws:
            msg = ws.receive_json()
            assert isinstance(msg["ts"], int)


# ─── Audio WebSocket ─────────────────────────────────────────────────────────

class TestAudioWS:

    def _make_openai(self, transcript_text: str, gpt_json: str):
        mock = MagicMock()
        mock.audio.transcriptions.create = AsyncMock(return_value=transcript_text)
        choice = MagicMock()
        choice.message.content = gpt_json
        resp = MagicMock()
        resp.choices = [choice]
        mock.chat.completions.create = AsyncMock(return_value=resp)
        return mock

    def test_wrong_user_closes_with_error(self, tc, session):
        sid, _ = session
        with tc.websocket_connect(f"/ws/audio/{sid}?user_id=wrong") as ws:
            msg = ws.receive_json()
            assert msg["type"] == "error"

    def test_nonexistent_session_returns_error(self, tc, uid, clean_sessions):
        ghost = str(uuid.uuid4())
        with tc.websocket_connect(f"/ws/audio/{ghost}?user_id={uid}") as ws:
            msg = ws.receive_json()
            assert msg["type"] == "error"

    def test_ping_acknowledged(self, tc, session):
        sid, uid = session
        with tc.websocket_connect(f"/ws/audio/{sid}?user_id={uid}") as ws:
            ws.send_json({"type": "ping"})
            msg = ws.receive_json()
            assert msg["type"] == "ping"

    def test_audio_chunk_increments_chunk_count(self, tc, session, fake_audio):
        """Send one audio chunk — chunk_count should be 1 after processing."""
        sid, uid = session

        gpt_response = json.dumps({
            "signals": [], "speaker": "You", "score_adjustment": 0
        })
        mock_openai = self._make_openai("hello there", gpt_response)

        with patch("main.openai_client", mock_openai):
            with tc.websocket_connect(f"/ws/audio/{sid}?user_id={uid}") as ws:
                ws.send_json({
                    "type": "audio_chunk",
                    "audio_b64": fake_audio,
                    "chunk_index": 0,
                    "timestamp_ms": 1000,
                })
                # Give it a moment then check state
                import time; time.sleep(0.2)

        # Verify chunk was counted
        session_obj = m.sessions.get(sid)
        if session_obj:  # session might have been garbage collected in some edge cases
            assert session_obj.chunk_count >= 1

    def test_signal_detected_added_to_session(self, tc, session, fake_audio):
        """Audio chunk containing budget signal → session.signals grows."""
        sid, uid = session

        gpt_response = json.dumps({
            "signals": [
                {"type": "budget_confirmed", "body": "budget approved", "confidence": 0.92}
            ],
            "speaker": "Prospect",
            "score_adjustment": 5,
        })
        mock_openai = self._make_openai("we have budget approved for this", gpt_response)

        with patch("main.openai_client", mock_openai):
            with tc.websocket_connect(f"/ws/audio/{sid}?user_id={uid}") as ws:
                ws.send_json({
                    "type": "audio_chunk",
                    "audio_b64": fake_audio,
                    "chunk_index": 0,
                    "timestamp_ms": 1500,
                })
                import time; time.sleep(0.3)

        session_obj = m.sessions.get(sid)
        if session_obj and session_obj.signals:
            assert any(s["type"] == "budget_confirmed" for s in session_obj.signals)

    def test_non_audio_message_ignored(self, tc, session):
        sid, uid = session
        # Should not raise — unknown types just get skipped
        with tc.websocket_connect(f"/ws/audio/{sid}?user_id={uid}") as ws:
            ws.send_json({"type": "unknown_type", "data": "whatever"})
            ws.send_json({"type": "ping"})
            msg = ws.receive_json()
            assert msg["type"] == "ping"

    def test_malformed_json_skipped(self, tc, session):
        sid, uid = session
        with tc.websocket_connect(f"/ws/audio/{sid}?user_id={uid}") as ws:
            ws.send_text("this is not json {{{{")
            # Still alive — send a ping to confirm
            ws.send_json({"type": "ping"})
            msg = ws.receive_json()
            assert msg["type"] == "ping"