import os
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# 📊 AI System
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig

load_dotenv(dotenv_path='../.env')

# --- Initialize AI Infrastructure ---
app = FastAPI(title="Sector 7 - Python Neural Core")

vertexai.init(project=os.getenv('GCP_PROJECT_ID'), location="us-central1")
ai_model = GenerativeModel("gemini-1.5-pro")

# --- Schemas ---
class AIRequest(BaseModel):
    description: str

class AIResult(BaseModel):
    type: str # fire | medical | accident
    severity: str # low | medium | high
    vehicles_required: List[str]
    action: str
    confidence: float
    escalation_risk: str

# --- Operations ---

@app.post("/api/analyze", response_model=AIResult)
async def analyze_incident(req: AIRequest):
    """
    🌪️ Tactical AI Analysis (Gemini 1.5)
    1. Sends text to Vertex AI
    2. Receives Tactical Analysis
    3. Returns JSON to Node.js Gateway
    """
    
    prompt = f"""
    Act as a Tactical Emergency Triage AI for Sector 7 Disaster Command.
    Analyze this report: "{req.description}"
    """
    
    response_schema = {
        "type": "object",
        "properties": {
            "type": {"type": "string", "enum": ["fire", "medical", "accident", "flood", "chemical"]},
            "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
            "vehicles_required": {"type": "array", "items": {"type": "string"}},
            "action": {"type": "string"},
            "confidence": {"type": "number"},
            "escalation_risk": {"type": "string", "enum": ["low", "medium", "high"]}
        },
        "required": ["type", "severity", "vehicles_required", "action", "confidence", "escalation_risk"]
    }

    generation_config = GenerationConfig(
        response_mime_type="application/json",
        response_schema=response_schema,
        temperature=0.2
    )
    
    try:
        print(f"[PYTHON] Analyzing Crisis: {req.description[:30]}...")
        response = ai_model.generate_content(prompt, generation_config=generation_config)
        return json.loads(response.text)
        
    except Exception as e:
        print(f"[PYTHON ERROR] Neural Link Fault: {e}")
        raise HTTPException(status_code=500, detail="AI Analysis Connection Interrupted")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
