# 🌍 Sector 7: AI-Driven Disaster Command System

<p align="center">
  <b>Developed for the Google Solution Challenge</b><br>
  A production-grade, highly resilient disaster triage and dispatch system.
</p>

## 🎯 Google Solution Challenge & UN SDGs Alignment
Sector 7 directly addresses the United Nations Sustainable Development Goals (SDGs) by providing immediate, intelligent, and scalable emergency infrastructure:

- **SDG 11 (Sustainable Cities and Communities):** Equips municipalities with real-time mapping, automated emergency vehicle dispatch, and traffic-aware routing.
- **SDG 13 (Climate Action):** Provides rapid response infrastructure for escalating climate-related disasters (wildfires, flooding) using predictive analysis.
- **SDG 3 (Good Health & Well-Being):** Reduces emergency medical response times through AI-prioritized triage routing.

## 🛠️ Google Technologies Utilized
This platform heavily relies on the Google developer ecosystem to guarantee production-level scalability and resilience:
1. **Google Gemini (Vision & Flash):** Powers our AI Triad for multimodal context analysis. Reads photos of disasters and parses panicked text to extract severity and required vehicle types in milliseconds.
2. **Google Firebase (Firestore & Storage):** Serves as the primary real-time synchronization layer. Handles dual-path writes and low-latency client-side syncing.
3. **Google Maps Routes API:** Generates sub-second driving polylines for emergency vehicles directly to incident coordinates.
4. **Google Cloud Run / Kubernetes Ready:** Containerized via Docker to seamlessly deploy to GCP.

## 🚀 System Architecture
Sector 7 is built around a **"Failsafe Degradation Protocol"**. In disaster scenarios, cloud infrastructure can fail.
- **Primary Tier**: Firebase Firestore + Gemini Vision/Flash.
- **Failsafe Tier**: Local MongoDB + Socket.io + Groq LLaMA (triggered automatically if Google APIs timeout or keys are missing).
- **Offline Sim**: If network connection drops entirely, clients simulate tactical dispatch using local trajectory math.

### Key Stack
- **Frontend**: Next.js 14, Tailwind CSS, React-Leaflet
- **Backend / Gateway**: Node.js, Express, Socket.io
- **Databases**: Firebase Firestore + Local MongoDB Replica Set (Hybrid Sync)
- **Authentication**: Clerk

## 📦 Production Deployment (Docker)
The system is fully containerized and production-ready.

1. **Environment Setup**:
   Copy `.env.example` to `.env.local` in `/frontend`, and `.env.example` to `.env` in `/backend`.
   Ensure `NEXT_PUBLIC_GEMINI_API_KEY` and Firebase credentials are filled.

2. **Boot the Cluster**:
   Using Docker Compose, build the standalone Next.js static asset and boot the localized MongoDB gateway:
   ```bash
   docker-compose --env-file frontend/.env.local up -d --build
   ```

3. **Verify Health**:
   - Access the Main UI: `http://localhost:3000`
   - Node.js API Gateway Health: `http://localhost:5000/health`
