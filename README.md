# <img src="assets/logo.png" width="48" align="center" /> Sector 7: AI-Driven Disaster Command System

[![Google Solution Challenge](https://img.shields.io/badge/Google-Solution%20Challenge%202026-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/community/solutions-challenge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Stack: Next.js + Gemini + Firebase](https://img.shields.io/badge/Stack-Next.js%20%2B%20Gemini%20%2B%20Firebase-orange?style=for-the-badge)](https://nextjs.org/)

---

## 🌟 The Vision
**Sector 7** is a production-grade, resilient emergency response platform designed to bridge the gap between chaotic disaster data and decisive tactical action. By leveraging the **Google AI Triad**, we automate triage, optimize vehicle dispatch, and ensure 100% uptime through a unique hybrid failsafe architecture.

![Sector 7 Mockup](assets/mockup.png)

---

## 🎯 UN Sustainable Development Goals Alignment
Sector 7 was engineered specifically to address the following United Nations SDGs:

*   **SDG 11: Sustainable Cities & Communities** – Implementing real-time digital infrastructure for emergency resilience.
*   **SDG 13: Climate Action** – Providing rapid-response tools for the increasing frequency of climate-driven disasters.
*   **SDG 3: Good Health & Well-Being** – Reducing critical response times to save lives through intelligent routing.

---

## 🧠 Core Innovation: The AI Triad
Most disaster systems rely on manual data entry. Sector 7 uses **Google Gemini (Vision & Flash)** to process unstructured chaos:

1.  **Multimodal Analysis**: Upload a photo of a disaster site; Gemini Vision identifies the hazard (fire, flood, structural collapse) and estimates severity.
2.  **Instant Triage**: Gemini Flash parses panicked voice-to-text inputs to extract precise coordinates and required resources in milliseconds.
3.  **Automated Dispatching**: The system recommends the optimal vehicle type (Ambulance, Fire Truck, Rescue Drone) based on AI-derived context.

---

## 🏗️ Technical Architecture
### "Failsafe Degradation Protocol"
Disasters often kill the internet. Sector 7 is built to survive:
*   **Primary Tier**: Google Firebase (Firestore/Storage) + Google Gemini. Global scale, real-time sync.
*   **Failsafe Tier**: Automated failover to a localized **MongoDB Replica Set** + **Socket.io** gateway if Google APIs are unreachable.
*   **Tactical Simulation**: Offline-first trajectory math allows vehicles to continue mission-critical routing even without a central heartbeat.

### The Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion, React-Leaflet.
- **Backend**: Node.js API Gateway + Python Simulation Engine.
- **Database**: Hybrid Firebase Firestore & MongoDB.
- **Auth**: Clerk (Enterprise-grade security).

---

## 🛠️ Google Technologies Used
| Technology | Purpose |
| :--- | :--- |
| **Google Gemini** | Multimodal Triage & Context Extraction |
| **Firebase** | Real-time Global Data Synchronization |
| **Maps Routes API** | Sub-second emergency vehicle pathfinding |
| **Cloud Run** | Serverless deployment for the Node.js gateway |

---

## 🚀 Getting Started (Production Ready)

The entire system is containerized for instant deployment.

### 1. Prerequisites
- Docker & Docker Compose
- Google Gemini API Key
- Firebase Project Credentials

### 2. Configuration
Create a `.env.local` in `/frontend` and `.env` in `/backend` using the provided `.env.example` templates.

### 3. Launch the Tactical Cluster
```bash
docker-compose --env-file frontend/.env.local up -d --build
```

### 4. Verify
- **Dashboard**: `http://localhost:3000`
- **API Health**: `http://localhost:5000/health`
- **Automation Node**: `http://localhost:5678` (n8n integration)

---

## 🎥 Project Walkthrough
> [!TIP]
> **[Watch our 2-minute Solution Video here!](YOUR_VIDEO_LINK_HERE)**

---

## 👥 The Team
- **Team Lead**: [Your Name] - Lead Architect & AI Integration
- **Collaborator**: [Name] - Frontend & UX Design
- **Collaborator**: [Name] - Backend & DevOps

---

<p align="center">
  Built with ❤️ for the <b>Google Solution Challenge 2024</b>.
</p>
