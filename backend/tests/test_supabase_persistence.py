"""
test_supabase_persistence.py — Tests for the Supabase persistence layer.

Mocks the Supabase client — no real DB calls.
Verifies:
  - Correct payload shape sent to calls table
  - Transcript rows saved separately
  - Status inferred from signals
  - Duration formatted correctly
  - Graceful handling of Supabase errors
"""

import time
import uuid
import pytest
from unittest.mock import MagicMock, patch
import os

os.environ.setdefault("OPENAI_API_KEY",      "sk-test")
os.environ.setdefault("SUPABASE_URL",         "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "fake-key")

import main as m


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _make_session(
    duration_s: int = 120,
    score: int = 72,
    signals: list = None,
    transcript: list = None,
) -> m.CallSession:
    s = m.CallSession(
        session_id=str(uuid.uuid4()),
        user_id=str(uuid.uuid4()),
        prospect_name="Test Prospect",
        company="Acme Corp",
        platform="zoom",
    )
    # Fake start time so duration_seconds() = duration_s
    s.started_at = time.time() - duration_s
    s.score = score
    s.signals = signals or []
    s.transcript = transcript or []
    return s


def _make_supabase_mock(call_id: str = None):
    call_id = call_id or str(uuid.uuid4())
    mock = MagicMock()

    insert_result = MagicMock()
    insert_result.data = [{"id": call_id}]

    table = MagicMock()
    table.insert.return_value.execute.return_value = insert_result
    mock.table.return_value = table
    return mock, call_id, table


FAKE_SUMMARY = {
    "ai_summary":       "Good call — budget confirmed and close signal detected.",
    "areas_to_improve": ["Be more specific on ROI"],
    "next_steps":       ["Send proposal by Friday"],
}


# ─── save_call ───────────────────────────────────────────────────────────────

class TestSaveCall:

    @pytest.mark.asyncio
    async def test_returns_call_id_on_success(self):
        session = _make_session()
        sb_mock, expected_id, _ = _make_supabase_mock()
        with patch("main.get_supabase", return_value=sb_mock):
            result = await m.save_call(session, FAKE_SUMMARY)
        assert result == expected_id

    @pytest.mark.asyncio
    async def test_returns_none_on_supabase_error(self):
        session = _make_session()
        sb_mock = MagicMock()
        sb_mock.table.return_value.insert.return_value.execute.side_effect = Exception("DB error")
        with patch("main.get_supabase", return_value=sb_mock):
            result = await m.save_call(session, FAKE_SUMMARY)
        assert result is None

    @pytest.mark.asyncio
    async def test_calls_table_insert_called(self):
        session = _make_session()
        sb_mock, _, table = _make_supabase_mock()
        with patch("main.get_supabase", return_value=sb_mock):
            await m.save_call(session, FAKE_SUMMARY)
        sb_mock.table.assert_called_with("calls")
        table.insert.assert_called_once()

    @pytest.mark.asyncio
    async def test_payload_contains_user_id(self):
        session = _make_session()
        sb_mock, _, table = _make_supabase_mock()
        with patch("main.get_supabase", return_value=sb_mock):
            await m.save_call(session, FAKE_SUMMARY)
        payload = table.insert.call_args[0][0]
        assert payload["user_id"] == session.user_id

    @pytest.mark.asyncio
    async def test_payload_contains_score(self):
        session = _make_session(score=88)
        sb_mock, _, table = _make_supabase_mock()
        with patch("main.get_supabase", return_value=sb_mock):
            await m.save_call(session, FAKE_SUMMARY)
        payload = table.insert.call_args[0][0]
        assert payload["score"] == 88

    @pytest.mark.asyncio
    async def test_payload_contains_ai_summary_as_notes(self):
        session = _make_session()
        sb_mock, _, table = _make_supabase_mock()
        with patch("main.get_supabase", return_value=sb_mock):
            await m.save_call(session, FAKE_SUMMARY)
        payload = table.insert.call_args[0][0]
        assert payload["notes"] == FAKE_SUMMARY["ai_summary"]

    @pytest.mark.asyncio
    async def test_payload_duration_format(self):
        """Duration stored as MM:SS string."""
        session = _make_session(duration_s=90)   # 1m30s
        sb_mock, _, table = _make_supabase_mock()
        with patch("main.get_supabase", return_value=sb_mock):
            await m.save_call(session, FAKE_SUMMARY)
        payload = table.insert.call_args[0][0]
        # Should be "01:30" format
        assert ":" in payload["duration"]
        parts = payload["duration"].split(":")
        assert len(parts) == 2

    @pytest.mark.asyncio
    async def test_transcript_saved_to_transcripts_table(self):
        transcript = [
            {"speaker": "You",      "text": "Hello!",          "timestamp_ms": 0},
            {"speaker": "Prospect", "text": "Hi, how are you?","timestamp_ms": 2000},
        ]
        session = _make_session(transcript=transcript)
        sb_mock, _, table = _make_supabase_mock()
        with patch("main.get_supabase", return_value=sb_mock):
            await m.save_call(session, FAKE_SUMMARY)
        # table("transcripts") should also be called
        table_calls = sb_mock.table.call_args_list
        tables_called = [c[0][0] for c in table_calls]
        assert "transcripts" in tables_called

    @pytest.mark.asyncio
    async def test_empty_transcript_skips_transcripts_insert(self):
        """No transcript → only calls table insert, no transcripts insert."""
        session = _make_session(transcript=[])
        sb_mock, _, table = _make_supabase_mock()
        with patch("main.get_supabase", return_value=sb_mock):
            await m.save_call(session, FAKE_SUMMARY)
        table_calls = [c[0][0] for c in sb_mock.table.call_args_list]
        assert "transcripts" not in table_calls

    @pytest.mark.asyncio
    async def test_signals_stored_as_titles(self):
        signals = [
            {"type": "budget_confirmed", "title": "Budget confirmed",  "color": "green"},
            {"type": "close_signal",     "title": "Close signal",      "color": "teal"},
        ]
        session = _make_session(signals=signals)
        sb_mock, _, table = _make_supabase_mock()
        with patch("main.get_supabase", return_value=sb_mock):
            await m.save_call(session, FAKE_SUMMARY)
        payload = table.insert.call_args[0][0]
        assert "Budget confirmed" in payload["signals"]
        assert "Close signal" in payload["signals"]

    @pytest.mark.asyncio
    async def test_unknown_prospect_defaults_to_unknown(self):
        session = _make_session()
        session.prospect_name = None
        sb_mock, _, table = _make_supabase_mock()
        with patch("main.get_supabase", return_value=sb_mock):
            await m.save_call(session, FAKE_SUMMARY)
        payload = table.insert.call_args[0][0]
        assert payload["prospect_name"] == "Unknown"


# ─── _infer_status ────────────────────────────────────────────────────────────

class TestInferStatus:

    def test_ready_to_close_returns_follow_up(self):
        signals = [{"type": "ready_to_close", "title": "Ready to close"}]
        assert m._infer_status(signals) == "follow_up"

    def test_budget_confirmed_returns_follow_up(self):
        signals = [{"type": "budget_confirmed", "title": "Budget confirmed"}]
        assert m._infer_status(signals) == "follow_up"

    def test_no_strong_signal_returns_completed(self):
        signals = [{"type": "competitor_mention", "title": "Competitor mention"}]
        assert m._infer_status(signals) == "completed"

    def test_empty_signals_returns_completed(self):
        assert m._infer_status([]) == "completed"

    def test_mixed_signals_prefers_follow_up(self):
        signals = [
            {"type": "competitor_mention", "title": "Competitor mention"},
            {"type": "budget_confirmed",   "title": "Budget confirmed"},
        ]
        assert m._infer_status(signals) == "follow_up"


# ─── _fmt (duration formatter) ────────────────────────────────────────────────

class TestFmtDuration:

    def test_zero_seconds(self):
        assert m._fmt(0) == "00:00"

    def test_90_seconds(self):
        assert m._fmt(90) == "01:30"

    def test_3600_seconds(self):
        assert m._fmt(3600) == "60:00"

    def test_format_has_colon(self):
        assert ":" in m._fmt(120)

    def test_minutes_zero_padded(self):
        result = m._fmt(5)
        assert result == "00:05"