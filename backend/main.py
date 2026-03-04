"""
SalesWhisper Backend — main.py
Single-file FastAPI server.
Run: uvicorn main:app --reload --port 8000
"""

import base64
import io
import json
import logging
import time
import uuid
import asyncio
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Literal, Optional

from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import AsyncOpenAI
from supabase import create_client, Client

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s — %(message)s",
)
log = logging.getLogger(__name__)

OPENAI_API_KEY      = os.environ["OPENAI_API_KEY"]
SUPABASE_URL        = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
APP_ENV             = os.getenv("APP_ENV", "development")
GPT_MODEL           = os.getenv("GPT_MODEL", "gpt-4o-mini")
WHISPER_MODEL       = os.getenv("WHISPER_MODEL", "whisper-1")
CHUNK_INTERVAL_S    = int(os.getenv("CHUNK_INTERVAL_S", "8"))
SIGNAL_COOLDOWN_S   = int(os.getenv("SIGNAL_COOLDOWN_S", "30"))
CORS_ORIGINS        = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,chrome-extension://*"
).split(",")

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

SignalType = Literal[
    "close_signal", "budget_confirmed", "decision_maker_present",
    "competitor_mention", "strong_interest", "price_objection",
    "follow_up_requested", "demo_requested", "ready_to_close",
    "risk_detected", "silence",
]

class StartSessionRequest(BaseModel):
    user_id: str
    prospect_name: Optional[str] = None
    company: Optional[str] = None
    platform: Optional[str] = None

class StartSessionResponse(BaseModel):
    session_id: str
    ws_url: str

class EndSessionRequest(BaseModel):
    session_id: str
    user_id: str


# ─────────────────────────────────────────────────────────────────────────────
# SESSION MANAGER
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class CallSession:
    session_id: str
    user_id: str
    prospect_name: Optional[str]
    company: Optional[str]
    platform: Optional[str]
    started_at: float = field(default_factory=time.time)
    score: int = 65
    transcript: list = field(default_factory=list)
    signals: list    = field(default_factory=list)
    suggestions: list = field(default_factory=list)
    chunk_count: int = 0
    recent_signals: dict = field(default_factory=dict)  # type -> last_ts
    ws_clients: list = field(default_factory=list)       # dashboard WebSockets

    def duration_seconds(self) -> int:
        return int(time.time() - self.started_at)

    def get_cooldown_keys(self, cooldown_s: int) -> set:
        now = time.time()
        return {k for k, ts in self.recent_signals.items() if now - ts < cooldown_s}

    def record_signals(self, types: list) -> None:
        now = time.time()
        for t in types:
            self.recent_signals[t] = now


class SessionManager:
    def __init__(self):
        self._sessions: dict[str, CallSession] = {}
        self._user_map: dict[str, str] = {}   # user_id -> session_id

    def create(self, session_id, user_id, prospect_name=None, company=None, platform=None) -> CallSession:
        # End previous session for this user
        if user_id in self._user_map:
            self._sessions.pop(self._user_map[user_id], None)
        s = CallSession(session_id=session_id, user_id=user_id,
                        prospect_name=prospect_name, company=company, platform=platform)
        self._sessions[session_id] = s
        self._user_map[user_id] = session_id
        log.info(f"Session created: {session_id} user={user_id}")
        return s

    def get(self, session_id: str) -> Optional[CallSession]:
        return self._sessions.get(session_id)

    def end(self, session_id: str) -> Optional[CallSession]:
        s = self._sessions.pop(session_id, None)
        if s:
            self._user_map.pop(s.user_id, None)
            log.info(f"Session ended: {session_id} duration={s.duration_seconds()}s")
        return s

    def add_ws(self, session_id: str, ws: WebSocket):
        s = self.get(session_id)
        if s and ws not in s.ws_clients:
            s.ws_clients.append(ws)

    def remove_ws(self, session_id: str, ws: WebSocket):
        s = self.get(session_id)
        if s and ws in s.ws_clients:
            s.ws_clients.remove(ws)

    async def broadcast(self, session_id: str, msg: dict):
        s = self.get(session_id)
        if not s:
            return
        dead = []
        for ws in s.ws_clients:
            try:
                await ws.send_json(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            s.ws_clients.remove(ws)


sessions = SessionManager()


# ─────────────────────────────────────────────────────────────────────────────
# AI SERVICE
# ─────────────────────────────────────────────────────────────────────────────

SIGNAL_META = {
    "close_signal":           {"title": "Close signal",           "color": "teal",  "delta": +5},
    "budget_confirmed":       {"title": "Budget confirmed",       "color": "green", "delta": +6},
    "decision_maker_present": {"title": "Decision maker present", "color": "green", "delta": +4},
    "competitor_mention":     {"title": "Competitor mention",     "color": "amber", "delta": -1},
    "strong_interest":        {"title": "Strong interest",        "color": "teal",  "delta": +4},
    "price_objection":        {"title": "Price objection",        "color": "amber", "delta": -2},
    "follow_up_requested":    {"title": "Follow-up requested",    "color": "teal",  "delta": +2},
    "demo_requested":         {"title": "Demo requested",         "color": "teal",  "delta": +3},
    "ready_to_close":         {"title": "Ready to close",         "color": "teal",  "delta": +8},
    "risk_detected":          {"title": "Risk detected",          "color": "red",   "delta": -4},
    "silence":                {"title": "Silence detected",       "color": "amber", "delta": -1},
}

SUGGESTION_MAP = {
    "price_objection":  {"trigger": "Price objection",   "category": "objection", "response": "I get it. Let's look at ROI — teams using SalesWhisper close 23% more deals in 90 days. What's one closed deal worth to you?"},
    "competitor_mention": {"trigger": "Competitor mention", "category": "reframe",   "response": "Great point. Unlike Gong which reviews calls after, we coach you during it — that's the difference between a replay and a real coach."},
    "close_signal":     {"trigger": "Buying signal",     "category": "close",     "response": "It sounds like this is exactly what you need. Would it make sense to walk through next steps today?"},
    "ready_to_close":   {"trigger": "Ready to close",    "category": "close",     "response": "Based on everything we've covered, I'd love to get you started. Can we confirm the details today?"},
    "risk_detected":    {"trigger": "Risk detected",     "category": "discovery", "response": "It sounds like there might be some concerns. Can you help me understand what would need to be true for this to move forward?"},
}

ANALYSIS_PROMPT = """You are an expert sales call AI analyst.
Analyze the transcript segment and return ONLY a JSON object:
{
  "signals": [
    {"type": "<signal_type>", "body": "<quote or context>", "confidence": <0.0-1.0>}
  ],
  "speaker": "<You|Prospect>",
  "score_adjustment": <integer -10 to +10>
}

Signal types: close_signal, budget_confirmed, decision_maker_present, competitor_mention,
strong_interest, price_objection, follow_up_requested, demo_requested, ready_to_close,
risk_detected, silence.

Return ONLY valid JSON. No markdown."""


async def transcribe_chunk(audio_b64: str, chunk_index: int) -> Optional[str]:
    try:
        audio_bytes = base64.b64decode(audio_b64)
        buf = io.BytesIO(audio_bytes)
        buf.name = f"chunk_{chunk_index}.webm"
        resp = await openai_client.audio.transcriptions.create(
            model=WHISPER_MODEL, file=buf, language="en", response_format="text"
        )
        text = resp.strip() if isinstance(resp, str) else str(resp).strip()
        return text or None
    except Exception as e:
        log.error(f"Whisper error chunk={chunk_index}: {e}")
        return None


async def analyze_transcript(text: str, context: list, timestamp_ms: int,
                              current_score: int, cooldown_keys: set):
    signals, suggestions = [], []
    score_update = None
    speaker = "You"

    if not text or len(text.strip()) < 5:
        return signals, suggestions, score_update, speaker

    ctx_str = "\n".join(f"{t['speaker']}: {t['text']}" for t in context[-5:])
    prompt  = f"Recent conversation:\n{ctx_str}\n\nNew segment:\n{text}"

    try:
        resp = await openai_client.chat.completions.create(
            model=GPT_MODEL,
            messages=[
                {"role": "system", "content": ANALYSIS_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.1,
            max_tokens=500,
            response_format={"type": "json_object"},
        )
        data   = json.loads(resp.choices[0].message.content or "{}")
        speaker = data.get("speaker", "You")
        total_delta = 0

        for sd in data.get("signals", []):
            sig_type   = sd.get("type")
            confidence = float(sd.get("confidence", 0.8))
            if confidence < 0.6 or sig_type not in SIGNAL_META:
                continue
            if sig_type in cooldown_keys:
                continue

            meta = SIGNAL_META[sig_type]
            sig  = {
                "id":           str(uuid.uuid4()),
                "type":         sig_type,
                "title":        meta["title"],
                "body":         sd.get("body", text[:120]),
                "confidence":   confidence,
                "timestamp_ms": timestamp_ms,
                "color":        meta["color"],
            }
            signals.append(sig)
            total_delta += meta["delta"]

            if sig_type in SUGGESTION_MAP:
                sm = SUGGESTION_MAP[sig_type]
                suggestions.append({
                    "id":           str(uuid.uuid4()),
                    "trigger":      sm["trigger"],
                    "category":     sm["category"],
                    "response":     sm["response"],
                    "timestamp_ms": timestamp_ms,
                })

        gpt_adj     = int(data.get("score_adjustment", 0))
        final_delta = max(-10, min(10, total_delta + gpt_adj))
        if final_delta != 0:
            new_score   = max(0, min(100, current_score + final_delta))
            score_update = {"score": new_score, "delta": final_delta,
                            "reason": f"{'↑' if final_delta > 0 else '↓'} {abs(final_delta)} pts"}

    except Exception as e:
        log.error(f"GPT analysis error: {e}")

    return signals, suggestions, score_update, speaker


async def generate_summary(transcript: list, signals: list, duration_s: int, score: int) -> dict:
    tx  = "\n".join(f"{t['speaker']}: {t['text']}" for t in transcript)
    sigs = ", ".join(s["title"] for s in signals) if signals else "none"
    prompt = f"""Analyze this sales call. Return ONLY JSON:
{{
  "ai_summary": "<2-3 sentence summary>",
  "areas_to_improve": ["<item1>", "<item2>"],
  "next_steps": ["<step1>", "<step2>", "<step3>"]
}}
Score: {score}/100 | Duration: {duration_s//60}m{duration_s%60}s | Signals: {sigs}
Transcript:
{tx[:3000]}"""
    try:
        resp = await openai_client.chat.completions.create(
            model=GPT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3, max_tokens=600,
            response_format={"type": "json_object"},
        )
        return json.loads(resp.choices[0].message.content or "{}")
    except Exception as e:
        log.error(f"Summary error: {e}")
        return {"ai_summary": "Analysis unavailable.", "areas_to_improve": [], "next_steps": []}


# ─────────────────────────────────────────────────────────────────────────────
# SUPABASE PERSISTENCE
# ─────────────────────────────────────────────────────────────────────────────

def _fmt(seconds: int) -> str:
    m, s = divmod(seconds, 60)
    return f"{m:02d}:{s:02d}"

def _infer_status(signals: list) -> str:
    types = {s.get("type") for s in signals}
    if "ready_to_close" in types or "budget_confirmed" in types:
        return "follow_up"
    return "completed"

async def save_call(session: CallSession, summary: dict) -> Optional[str]:
    try:
        sb = get_supabase()
        row = {
            "user_id":       session.user_id,
            "prospect_name": session.prospect_name or "Unknown",
            "company":       session.company,
            "duration":      _fmt(session.duration_seconds()),
            "score":         session.score,
            "status":        _infer_status(session.signals),
            "notes":         summary.get("ai_summary", ""),
            "signals":       [s["title"] for s in session.signals],
        }
        result  = sb.table("calls").insert(row).execute()
        call_id = result.data[0]["id"]

        if session.transcript:
            rows = [
                {"call_id": call_id, "user_id": session.user_id,
                 "speaker": t["speaker"], "text": t["text"],
                 "timestamp_ms": t.get("timestamp_ms", 0)}
                for t in session.transcript
            ]
            sb.table("transcripts").insert(rows).execute()

        log.info(f"Call saved: {call_id}")
        return call_id
    except Exception as e:
        log.error(f"save_call error: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="SalesWhisper API",
    version="0.1.0",
    docs_url="/docs" if APP_ENV == "development" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ts() -> int:
    return int(time.time() * 1000)


# ─────────────────────────────────────────────────────────────────────────────
# REST ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "active_sessions": len(sessions._sessions)}


@app.post("/api/v1/sessions/start", response_model=StartSessionResponse)
async def start_session(body: StartSessionRequest):
    session_id = str(uuid.uuid4())
    sessions.create(
        session_id=session_id,
        user_id=body.user_id,
        prospect_name=body.prospect_name,
        company=body.company,
        platform=body.platform,
    )
    base = "ws://localhost:8000" if APP_ENV == "development" else "wss://api.saleswhisper.ai"
    return StartSessionResponse(
        session_id=session_id,
        ws_url=f"{base}/ws/audio/{session_id}?user_id={body.user_id}",
    )


@app.post("/api/v1/sessions/end")
async def end_session(body: EndSessionRequest):
    session = sessions.get(body.session_id)
    if not session or session.user_id != body.user_id:
        raise HTTPException(status_code=404, detail="Session not found")

    summary = await generate_summary(
        session.transcript, session.signals,
        session.duration_seconds(), session.score
    )
    call_id = await save_call(session, summary)
    ended   = sessions.end(body.session_id)

    return {
        "ok": True,
        "call_id": call_id,
        "duration_seconds": ended.duration_seconds() if ended else 0,
        "final_score": ended.score if ended else 0,
        "summary": summary,
    }


@app.get("/api/v1/sessions/{session_id}/state")
async def get_session_state(session_id: str, user_id: str):
    session = sessions.get(session_id)
    if not session or session.user_id != user_id:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id":  session_id,
        "score":       session.score,
        "duration_s":  session.duration_seconds(),
        "signals":     session.signals[-20:],
        "suggestions": session.suggestions[-10:],
        "transcript":  session.transcript[-50:],
        "chunk_count": session.chunk_count,
    }


# ─────────────────────────────────────────────────────────────────────────────
# WEBSOCKET — EXTENSION (audio in)
# ─────────────────────────────────────────────────────────────────────────────

@app.websocket("/ws/audio/{session_id}")
async def audio_ws(websocket: WebSocket, session_id: str, user_id: str = Query(...)):
    await websocket.accept()
    session = sessions.get(session_id)

    if not session or session.user_id != user_id:
        await websocket.send_json({"type": "error", "payload": {"message": "Invalid session"}, "session_id": session_id, "ts": _ts()})
        await websocket.close()
        return

    log.info(f"Extension WS connected: session={session_id}")
    ping_task = None

    async def keepalive():
        while True:
            await asyncio.sleep(20)
            try:
                await websocket.send_json({"type": "ping", "payload": {}, "session_id": session_id, "ts": _ts()})
            except Exception:
                break

    try:
        ping_task = asyncio.create_task(keepalive())

        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if msg.get("type") == "ping":
                await websocket.send_json({"type": "ping", "payload": {}, "session_id": session_id, "ts": _ts()})
                continue

            if msg.get("type") != "audio_chunk":
                continue

            audio_b64    = msg.get("audio_b64", "")
            chunk_index  = int(msg.get("chunk_index", 0))
            timestamp_ms = int(msg.get("timestamp_ms", _ts()))

            if not audio_b64:
                continue

            session.chunk_count += 1

            # 1. Transcribe
            text = await transcribe_chunk(audio_b64, chunk_index)
            if not text:
                continue

            # 2. Analyze
            cooldown_keys = session.get_cooldown_keys(SIGNAL_COOLDOWN_S)
            sigs, sugs, score_upd, speaker = await analyze_transcript(
                text, session.transcript, timestamp_ms, session.score, cooldown_keys
            )

            # 3. Store + broadcast transcript
            line = {"speaker": speaker, "text": text, "timestamp_ms": timestamp_ms}
            session.transcript.append(line)
            await sessions.broadcast(session_id, {"type": "transcript", "payload": line, "session_id": session_id, "ts": _ts()})

            # 4. Signals
            if sigs:
                session.record_signals([s["type"] for s in sigs])
                for sig in sigs:
                    session.signals.append(sig)
                    await sessions.broadcast(session_id, {"type": "signal", "payload": sig, "session_id": session_id, "ts": _ts()})

            # 5. Suggestions
            for sug in sugs:
                session.suggestions.append(sug)
                await sessions.broadcast(session_id, {"type": "suggestion", "payload": sug, "session_id": session_id, "ts": _ts()})

            # 6. Score
            if score_upd:
                session.score = score_upd["score"]
                await sessions.broadcast(session_id, {"type": "score_update", "payload": score_upd, "session_id": session_id, "ts": _ts()})

    except WebSocketDisconnect:
        log.info(f"Extension WS disconnected: session={session_id}")
    except Exception as e:
        log.error(f"Audio WS error session={session_id}: {e}")
    finally:
        if ping_task:
            ping_task.cancel()


# ─────────────────────────────────────────────────────────────────────────────
# WEBSOCKET — DASHBOARD (events out)
# ─────────────────────────────────────────────────────────────────────────────

@app.websocket("/ws/dashboard/{session_id}")
async def dashboard_ws(websocket: WebSocket, session_id: str, user_id: str = Query(...)):
    await websocket.accept()
    session = sessions.get(session_id)

    if not session or session.user_id != user_id:
        await websocket.send_json({"type": "error", "payload": {"message": "Invalid or expired session"}, "session_id": session_id, "ts": _ts()})
        await websocket.close()
        return

    sessions.add_ws(session_id, websocket)
    log.info(f"Dashboard WS connected: session={session_id}")

    # Send snapshot of current state immediately
    await websocket.send_json({
        "type": "snapshot",
        "payload": {
            "score":       session.score,
            "signals":     session.signals[-20:],
            "suggestions": session.suggestions[-10:],
            "transcript":  session.transcript[-50:],
            "duration_s":  session.duration_seconds(),
        },
        "session_id": session_id,
        "ts": _ts(),
    })

    try:
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                if msg == "ping":
                    await websocket.send_json({"type": "ping", "payload": {}, "session_id": session_id, "ts": _ts()})
            except asyncio.TimeoutError:
                # Send keepalive
                await websocket.send_json({"type": "ping", "payload": {}, "session_id": session_id, "ts": _ts()})
    except WebSocketDisconnect:
        pass
    finally:
        sessions.remove_ws(session_id, websocket)
        log.info(f"Dashboard WS disconnected: session={session_id}")


# ─────────────────────────────────────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    log.info(f"SalesWhisper API ready — env={APP_ENV} gpt={GPT_MODEL} whisper={WHISPER_MODEL}")