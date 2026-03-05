"""
conftest.py — shared pytest fixtures for SalesWhisper backend tests.

Strategy:
- Patch OpenAI and Supabase at the module level so no real HTTP calls are made.
- Each test gets a fresh FastAPI TestClient and a clean SessionManager.
- The AsyncOpenAI client and Supabase client are replaced with mocks that
  return realistic but hardcoded responses.
"""

import json
import time
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient, ASGITransport


# ─── Patch environment BEFORE main.py is imported ───────────────────────────
# This prevents main.py from crashing with missing env vars during test collection.
import os
os.environ.setdefault("OPENAI_API_KEY",       "sk-test-fake-key")
os.environ.setdefault("SUPABASE_URL",          "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY",  "fake-service-key")
os.environ.setdefault("APP_ENV",               "development")
os.environ.setdefault("GPT_MODEL",             "gpt-4o-mini")
os.environ.setdefault("WHISPER_MODEL",         "whisper-1")


# ─── Fake AI responses ───────────────────────────────────────────────────────

FAKE_WHISPER_TEXT = "I think the pricing looks good and we have budget approved."

FAKE_GPT_ANALYSIS = json.dumps({
    "signals": [
        {
            "type": "budget_confirmed",
            "body": "we have budget approved",
            "confidence": 0.92,
        },
        {
            "type": "close_signal",
            "body": "pricing looks good",
            "confidence": 0.85,
        },
    ],
    "speaker": "Prospect",
    "score_adjustment": 5,
})

FAKE_GPT_SUMMARY = json.dumps({
    "ai_summary": "Strong call — budget confirmed and close signal detected.",
    "areas_to_improve": ["Ask for a specific timeline", "Confirm legal stakeholders"],
    "next_steps": ["Send proposal today", "Schedule follow-up for Friday"],
})


def _make_openai_mock():
    """Return an AsyncOpenAI-like mock with transcriptions + chat completions."""
    mock = MagicMock()

    # Whisper: audio.transcriptions.create → returns plain text string
    mock.audio = MagicMock()
    mock.audio.transcriptions = MagicMock()
    mock.audio.transcriptions.create = AsyncMock(return_value=FAKE_WHISPER_TEXT)

    # GPT: chat.completions.create → returns object with .choices[0].message.content
    def _make_choice(content: str):
        choice = MagicMock()
        choice.message.content = content
        return choice

    async def _fake_chat(**kwargs):
        # Detect which call this is by inspecting messages
        messages = kwargs.get("messages", [])
        user_content = " ".join(
            m.get("content", "") for m in messages if m.get("role") == "user"
        )
        if "Analyze this sales call" in user_content:
            content = FAKE_GPT_SUMMARY
        else:
            content = FAKE_GPT_ANALYSIS
        resp = MagicMock()
        resp.choices = [_make_choice(content)]
        return resp

    mock.chat = MagicMock()
    mock.chat.completions = MagicMock()
    mock.chat.completions.create = _fake_chat
    return mock


def _make_supabase_mock(call_id: str = None):
    """Return a Supabase client mock that returns predictable data."""
    call_id = call_id or str(uuid.uuid4())
    mock = MagicMock()

    # calls.insert().execute() → returns inserted row
    insert_result = MagicMock()
    insert_result.data = [{"id": call_id, "score": 72}]

    table_mock = MagicMock()
    table_mock.insert.return_value.execute.return_value = insert_result
    table_mock.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    mock.table.return_value = table_mock
    return mock, call_id


# ─── Core fixtures ───────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def call_id():
    return str(uuid.uuid4())


@pytest.fixture()
def openai_mock():
    return _make_openai_mock()


@pytest.fixture()
def supabase_mock(call_id):
    mock, _ = _make_supabase_mock(call_id)
    return mock


@pytest.fixture()
def app_with_mocks(openai_mock, supabase_mock):
    """
    Import main.py with OpenAI + Supabase patched.
    Returns the FastAPI app instance.
    """
    with patch("main.openai_client", openai_mock), \
         patch("main.get_supabase", return_value=supabase_mock):
        import main as m
        # Reset session manager between tests
        m.sessions._sessions.clear()
        m.sessions._user_map.clear()
        yield m.app


@pytest.fixture()
async def client(app_with_mocks):
    """Async HTTP client for REST endpoint tests."""
    async with AsyncClient(
        transport=ASGITransport(app=app_with_mocks),
        base_url="http://test",
    ) as c:
        yield c


# ─── Helpers ────────────────────────────────────────────────────────────────

@pytest.fixture()
def fake_user_id():
    return str(uuid.uuid4())


@pytest.fixture()
def fake_audio_b64():
    """Minimal base64 payload — Whisper is mocked so content doesn't matter."""
    import base64
    return base64.b64encode(b"\x00" * 1024).decode()