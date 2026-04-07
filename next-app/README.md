# 🌍 Sector 7: Next.js Disaster Response Dashboard

A production-ready, real-time command center built with **Next.js 14**, **Clerk**, and **Firebase**.

## 🚀 Key Technologies
- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk (Middleware-ready authentication)
- **Map**: Leaflet + React-Leaflet (Client-side dynamic rendering)
- **Database**: Firebase Realtime DB (Live synchronization)
- **Styling**: Tailwind CSS (Sector 7 Dark Theme)
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📁 Project Structure
```text
next-app/
├── src/
│   ├── app/
│   │   ├── layout.js      # Clerk Provider & Global Styles
│   │   ├── page.js        # Main Dashboard Orchestrator
│   │   └── globals.css    # Mission-Dark CSS & Leaflet Overrides
│   ├── components/        # Strategic UI Modules
│   │   ├── MapComponent.js
│   │   ├── IncidentInput.js
│   │   └── ...
│   └── hooks/
│       └── useFirebaseData.js
├── tailwind.config.js     # Tactical Design Tokens
└── next.config.mjs        # Next.js Framework Config
```

## 🛠️ Setup Instructions

1. **Install Dependencies**:
   ```bash
   cd next-app
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the `next-app/` root and add your keys:
   ```env
   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Firebase Realtime DB
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

3. **Required Assets**:
   Ensure `marker-icon.png`, `marker-icon-2x.png`, and `marker-shadow.png` are in the `public/` folder (standard Leaflet assets).

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🚨 System Features
- **Dynamic Routing**: Automatic map polyline generation from vehicle to incident.
- **AI Neural Triage**: Input console with processing overlays and dispatch logic.
- **SSR-Safe Maps**: Dynamic client-side dynamic imports for Leaflet components.
- **Role-Based Auth UI**: Clerk-guarded dashboard with custom landing page.
