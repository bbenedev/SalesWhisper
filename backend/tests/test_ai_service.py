"""
test_ai_service.py — Unit tests for the AI analysis pipeline.

Tests:
  - transcribe_chunk()
  - analyze_transcript()
  - generate_summary()
  - Signal filtering (confidence threshold, cooldown)
  - Score clamping (always 0–100)
  - Speaker detection
"""

import json
import base64
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import os

os.environ.setdefault("OPENAI_API_KEY",      "sk-test")
os.environ.setdefault("SUPABASE_URL",         "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "fake-key")

import main as m


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _make_completion(content: str):
    """Build a minimal OpenAI chat.completions response mock."""
    choice = MagicMock()
    choice.message.content = content
    resp = MagicMock()
    resp.choices = [choice]
    return resp


GOOD_ANALYSIS = json.dumps({
    "signals": [
        {"type": "budget_confirmed", "body": "we have budget", "confidence": 0.9},
        {"type": "close_signal",     "body": "let's move forward", "confidence": 0.8},
    ],
    "speaker": "Prospect",
    "score_adjustment": 4,
})

LOW_CONFIDENCE_ANALYSIS = json.dumps({
    "signals": [
        {"type": "budget_confirmed", "body": "maybe budget", "confidence": 0.3},
    ],
    "speaker": "You",
    "score_adjustment": 0,
})

EMPTY_ANALYSIS = json.dumps({
    "signals": [],
    "speaker": "You",
    "score_adjustment": 0,
})

NEGATIVE_ANALYSIS = json.dumps({
    "signals": [
        {"type": "price_objection", "body": "too expensive", "confidence": 0.95},
        {"type": "risk_detected",   "body": "legal concerns", "confidence": 0.88},
    ],
    "speaker": "Prospect",
    "score_adjustment": -3,
})


# ─── transcribe_chunk ────────────────────────────────────────────────────────

class TestTranscribeChunk:
    @pytest.mark.asyncio
    async def test_returns_text_on_success(self):
        mock_client = MagicMock()
        mock_client.audio.transcriptions.create = AsyncMock(
            return_value="Hello world, we have budget approved."
        )
        with patch("main.openai_client", mock_client):
            result = await m.transcribe_chunk(
                base64.b64encode(b"\x00" * 64).decode(), chunk_index=0
            )
        assert result == "Hello world, we have budget approved."

    @pytest.mark.asyncio
    async def test_returns_none_on_empty_response(self):
        mock_client = MagicMock()
        mock_client.audio.transcriptions.create = AsyncMock(return_value="")
        with patch("main.openai_client", mock_client):
            result = await m.transcribe_chunk(
                base64.b64encode(b"\x00" * 64).decode(), chunk_index=1
            )
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_on_api_error(self):
        mock_client = MagicMock()
        mock_client.audio.transcriptions.create = AsyncMock(
            side_effect=Exception("OpenAI 429 rate limit")
        )
        with patch("main.openai_client", mock_client):
            result = await m.transcribe_chunk(
                base64.b64encode(b"\x00" * 64).decode(), chunk_index=2
            )
        assert result is None

    @pytest.mark.asyncio
    async def test_strips_whitespace(self):
        mock_client = MagicMock()
        mock_client.audio.transcriptions.create = AsyncMock(
            return_value="  trimmed text  "
        )
        with patch("main.openai_client", mock_client):
            result = await m.transcribe_chunk(
                base64.b64encode(b"\x00" * 64).decode(), chunk_index=3
            )
        assert result == "trimmed text"


# ─── analyze_transcript ──────────────────────────────────────────────────────

class TestAnalyzeTranscript:

    async def _run(self, gpt_response: str, text: str = "test input",
                   current_score: int = 65, cooldown_keys: set = None):
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(
            return_value=_make_completion(gpt_response)
        )
        with patch("main.openai_client", mock_client):
            return await m.analyze_transcript(
                text=text,
                context=[],
                timestamp_ms=1000,
                current_score=current_score,
                cooldown_keys=cooldown_keys or set(),
            )

    @pytest.mark.asyncio
    async def test_returns_tuple_of_four(self):
        result = await self._run(GOOD_ANALYSIS)
        assert len(result) == 4

    @pytest.mark.asyncio
    async def test_detects_signals(self):
        signals, _, _, _ = await self._run(GOOD_ANALYSIS)
        assert len(signals) >= 1

    @pytest.mark.asyncio
    async def test_signal_has_required_fields(self):
        signals, _, _, _ = await self._run(GOOD_ANALYSIS)
        sig = signals[0]
        assert "type" in sig
        assert "title" in sig
        assert "color" in sig
        assert "confidence" in sig
        assert "timestamp_ms" in sig

    @pytest.mark.asyncio
    async def test_filters_low_confidence_signals(self):
        signals, _, _, _ = await self._run(LOW_CONFIDENCE_ANALYSIS)
        assert len(signals) == 0  # 0.3 confidence < 0.6 threshold

    @pytest.mark.asyncio
    async def test_speaker_detected(self):
        _, _, _, speaker = await self._run(GOOD_ANALYSIS)
        assert speaker == "Prospect"

    @pytest.mark.asyncio
    async def test_score_update_on_positive_signals(self):
        _, _, score_update, _ = await self._run(GOOD_ANALYSIS, current_score=65)
        assert score_update is not None
        assert score_update["score"] > 65

    @pytest.mark.asyncio
    async def test_score_update_on_negative_signals(self):
        _, _, score_update, _ = await self._run(NEGATIVE_ANALYSIS, current_score=65)
        assert score_update is not None
        assert score_update["score"] < 65

    @pytest.mark.asyncio
    async def test_score_never_exceeds_100(self):
        _, _, score_update, _ = await self._run(GOOD_ANALYSIS, current_score=99)
        if score_update:
            assert score_update["score"] <= 100

    @pytest.mark.asyncio
    async def test_score_never_below_zero(self):
        _, _, score_update, _ = await self._run(NEGATIVE_ANALYSIS, current_score=1)
        if score_update:
            assert score_update["score"] >= 0

    @pytest.mark.asyncio
    async def test_no_signals_on_empty_analysis(self):
        signals, sugs, score_update, _ = await self._run(EMPTY_ANALYSIS)
        assert signals == []
        assert sugs == []
        assert score_update is None

    @pytest.mark.asyncio
    async def test_cooldown_blocks_signal(self):
        # price_objection already in cooldown
        signals, _, _, _ = await self._run(
            NEGATIVE_ANALYSIS,
            cooldown_keys={"price_objection", "risk_detected"},
        )
        assert len(signals) == 0

    @pytest.mark.asyncio
    async def test_short_text_skipped(self):
        """Text under 5 chars should return empty results without calling GPT."""
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock()
        with patch("main.openai_client", mock_client):
            result = await m.analyze_transcript(
                text="hi", context=[], timestamp_ms=0,
                current_score=65, cooldown_keys=set()
            )
        signals, sugs, score_upd, speaker = result
        assert signals == []
        mock_client.chat.completions.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_returns_suggestion_for_price_objection(self):
        _, suggestions, _, _ = await self._run(NEGATIVE_ANALYSIS)
        triggers = [s["trigger"] for s in suggestions]
        assert "Price objection" in triggers

    @pytest.mark.asyncio
    async def test_gpt_error_returns_empty_gracefully(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(
            side_effect=Exception("API down")
        )
        with patch("main.openai_client", mock_client):
            signals, sugs, score_upd, speaker = await m.analyze_transcript(
                text="sufficient text here", context=[], timestamp_ms=0,
                current_score=65, cooldown_keys=set()
            )
        assert signals == []
        assert speaker == "You"  # default


# ─── generate_summary ────────────────────────────────────────────────────────

class TestGenerateSummary:

    FAKE_SUMMARY = json.dumps({
        "ai_summary": "Strong call — budget confirmed.",
        "areas_to_improve": ["Ask for timeline", "Confirm stakeholders"],
        "next_steps": ["Send proposal", "Schedule follow-up"],
    })

    async def _run(self, gpt_response: str, transcript=None, signals=None):
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(
            return_value=_make_completion(gpt_response)
        )
        with patch("main.openai_client", mock_client):
            return await m.generate_summary(
                transcript=transcript or [
                    {"speaker": "You", "text": "How's budget looking?"},
                    {"speaker": "Prospect", "text": "We have budget approved."},
                ],
                signals=signals or [{"title": "Budget confirmed", "type": "budget_confirmed"}],
                duration_s=360,
                score=78,
            )

    @pytest.mark.asyncio
    async def test_returns_dict(self):
        result = await self._run(self.FAKE_SUMMARY)
        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_has_ai_summary(self):
        result = await self._run(self.FAKE_SUMMARY)
        assert "ai_summary" in result
        assert isinstance(result["ai_summary"], str)

    @pytest.mark.asyncio
    async def test_has_next_steps(self):
        result = await self._run(self.FAKE_SUMMARY)
        assert "next_steps" in result
        assert isinstance(result["next_steps"], list)

    @pytest.mark.asyncio
    async def test_has_areas_to_improve(self):
        result = await self._run(self.FAKE_SUMMARY)
        assert "areas_to_improve" in result

    @pytest.mark.asyncio
    async def test_gpt_error_returns_fallback(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(
            side_effect=Exception("rate limit")
        )
        with patch("main.openai_client", mock_client):
            result = await m.generate_summary([], [], 0, 0)
        assert result["ai_summary"] == "Analysis unavailable."
        assert result["next_steps"] == []

    @pytest.mark.asyncio
    async def test_empty_transcript_doesnt_crash(self):
        result = await self._run(self.FAKE_SUMMARY, transcript=[], signals=[])
        assert "ai_summary" in result