from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import tempfile
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.get("/")
def read_root():
    return {"status": "SalesWhisper backend funcionando"}

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    try:
        # Guarda el audio temporalmente
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Transcribe con Whisper
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        
        os.unlink(tmp_path)
        transcript_text = transcript.text

        if not transcript_text.strip():
            return {"transcript": "", "suggestion": ""}

        # Genera sugerencia con GPT-4
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert sales coach helping a salesperson during a live call.
                    Analyze what was just said and provide ONE short, specific, actionable suggestion.
                    Be concise (max 2 sentences). Focus on: handling objections, closing opportunities, 
                    asking better questions, or building rapport.
                    Respond only with the suggestion, no preamble."""
                },
                {
                    "role": "user", 
                    "content": f"The prospect just said: {transcript_text}"
                }
            ],
            max_tokens=100
        )

        suggestion = response.choices[0].message.content

        return {
            "transcript": transcript_text,
            "suggestion": suggestion
        }

    except Exception as e:
        return {"error": str(e), "transcript": "", "suggestion": ""}