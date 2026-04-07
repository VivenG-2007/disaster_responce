import os
import time
import random
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# 🔥 Firebase Admin
import firebase_admin
from firebase_admin import credentials, db

# 📊 Analytics & AI
from elasticsearch import Elasticsearch
import vertexai
from vertexai.generative_models import GenerativeModel

load_dotenv()

# --- Initialize Project ---
app = FastAPI(title="Sector 7 - Disaster Tactical Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Firebase System
firebase_cred = credentials.Certificate("./serviceAccountKey.json")
firebase_admin.initialize_app(firebase_cred, {
    'databaseURL': os.getenv('FIREBASE_DATABASE_URL')
})

# 2. Vertex AI (Gemini) System
vertexai.init(project=os.getenv('GCP_PROJECT_ID'), location="us-central1")
ai_model = GenerativeModel("gemini-1.5-pro")

# 3. Elasticsearch System
es_client = Elasticsearch(
    os.getenv('ELASTICSEARCH_URL'),
    basic_auth=(os.getenv('ELASTIC_USER'), os.getenv('ELASTIC_PASS'))
)

# --- Schemas ---
class IncidentReport(BaseModel):
    description: str
    lat: Optional[float] = None
    lng: Optional[float] = None

class AIResponse(BaseModel):
    type: str # fire | medical | accident
    severity: str # low | medium | high
    vehicles_required: List[str]
    action: str

# --- Operations ---

@app.get("/api/health")
async def health():
    return {"status": "Operational", "node": "Mumbai-7", "timestamp": time.time()}

@app.post("/api/incident", response_model=AIResponse)
async def report_incident(report: IncidentReport):
    """
    🚨 AI-Triage & Dispatch Entry Point
    1. Sends report to Gemini
    2. Receives Tactical JSON
    3. Broadcasts to Firebase Tactical Grid
    4. Indexes for 24h analytical heatmap
    """
    
    # A. AI Analysis via Gemini
    prompt = f"""
    Act as a Tactical Emergency Triage AI for Sector 7 Disaster Command.
    Analyze this report: "{report.description}"
    
    Respond STRICTLY in JSON:
    {{
      "type": "fire | medical | accident",
      "severity": "low | medium | high",
      "vehicles_required": ["ambulance", "firetruck", "police"],
      "action": "Immediate evacuation recommended."
    }}
    """
    
    try:
        response = ai_model.generate_content(prompt)
        ai_data = json.loads(response.text.replace('```json', '').replace('```', '').strip())
        
        # B. Smart Assignment (Simulated nearest vehicle)
        # In a real app, calculate distance between report.lat and available vehicles in Firebase
        vehicle_id = f"V-{random.randint(100, 999)}"
        
        # C. Broadcast to Firebase (Tactical Feed)
        ref = db.reference('incidents').push()
        incident_entry = {
            "id": ref.key,
            "description": report.description,
            "type": ai_data['type'],
            "severity": ai_data['severity'],
            "position": [report.lat or 19.0760, report.lng or 72.8777],
            "assigned_vehicle": vehicle_id,
            "timestamp": time.time()
        }
        ref.set(incident_entry)
        
        # D. Index in Elasticsearch (Thermal Mapping)
        es_client.index(index="disaster_logs", document=incident_entry)
        
        return AIResponse(**ai_data)
        
    except Exception as e:
        print(f"Neural Link failure: {e}")
        raise HTTPException(status_code=500, detail="AI Analysis Connection Interrupted")

@app.get("/api/vehicles")
async def get_vehicles():
    """Returns the live tactical feed of all responders."""
    return db.reference('vehicles').get()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
