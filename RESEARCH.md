# User Research & Empathy Alignment — Nexus Command

To ensure that Nexus Command actively solves real-world frictions rather than acting solely as a demonstrative prototype, our team conducted interviews with active emergency and civic responders in the Keesara Mandal region.

## 🧑‍🚒 Interview 1: Emergency Operator (Keesara Fire Station)
**Date:** March 2026
**Respondent:** Lead Dispatch Technician
**Primary Goal:** Understand dispatch bottlenecks during local incidents.

### Key Insights:
- **Pain Point:** "Currently, radio coordination and verbal cross-referencing to find the closest vehicle costs us 4-6 minutes before a truck even starts moving."
- **Direct Quote:** *"If I could just see the nearest available unit on a map instantly and get an automated dispatch ping, that alone will cut our response times in half and save lives."*

### How This Shaped Our Design:
- **Smart Assignment Engine:** We prioritized building the Haversine distance-matching algorithm in the Node.js backend. Instead of an admin guessing which truck to send, Nexus Command instantly locks the closest resource of the correct category.

---

## 👩‍💼 Interview 2: Civic Coordinator (GHMC Medchal Division)
**Date:** March 2026
**Respondent:** Zonal Operations Manager
**Primary Goal:** Understand post-crisis data requirements for civic planning.

### Key Insights:
- **Pain Point:** "During floods or chemical leaks, we have zero visibility into incident clustering. By the time we look back at written logs for the shift, it's too late to redirect preventative resources."
- **Direct Quote:** *"We need a bird's-eye view that doesn't require a data science degree. Something that lights up where the problems are compounding."*

### How This Shaped Our Design:
- **Heatmap Layer Integration:** We integrated Elasticsearch to index every reported incident. The people-facing "Public View" now defaults to a live 24H Heatmap layer (fetched via `GET /api/heatmap`), providing instant spatial awareness of compounding dangers across the grid.

---

## 🚑 Interview 3: Volunteer Paramedic
**Date:** Late March 2026
**Respondent:** Independent EMT Volunteer
**Primary Goal:** Evaluate public reporting ease-of-use.

### Key Insights:
- **Pain Point:** "In a panic, citizens can't fill out 5-page forms. They just want to type 'fire at the mall' or 'car crash on ORR'."
- **Direct Quote:** *"If you make a citizen answer ten dropdowns about severity while someone is bleeding, your app will never be used."*

### How This Shaped Our Design:
- **Zero-Friction Prompting (AI Triage):** We implemented Google Gemini 1.5 Pro to handle triage. The citizen only encounters a single text box ("Incident Pulse"). They can type naturally, and the *AI* infers the Severity, Incident Type, and Required Responders.
