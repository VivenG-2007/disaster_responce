require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const { Client } = require('@elastic/elasticsearch');
const { PubSub } = require('@google-cloud/pubsub');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const app = express();
const PORT = process.env.NODE_PORT || 5000;
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000/api/analyze';


// 1. 🔥 Firebase Admin Setup
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
const db = admin.database();

// 2. 📊 Elasticsearch Analytics Setup
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// 3. 🛰️ Google Cloud Pub/Sub System
const pubsub = new PubSub({ projectId: process.env.GCP_PROJECT_ID });
const TOPIC_NAME = process.env.PUBSUB_TOPIC || 'tactical-incidents';

// PubSub Subscriber (Mock function running inside the gateway for simplicity)
const subscriptionName = 'tactical-incidents-sub';
// Avoid failing if Google credentials aren't fully configured
try {
    const subscription = pubsub.subscription(subscriptionName);
    subscription.on('message', (message) => {
        const incident = JSON.parse(message.data.toString());
        if (incident.severity === 'high') {
            console.log(`[CLOUD FN MOCK] High-severity alert triggered for: ${incident.type} at ${incident.timestamp}`);
        }
        message.ack();
    });
} catch (e) {
    console.warn("[NODE] PubSub Sub skipping (credentials needed):", e.message);
}

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, max: 20,
    message: { error: 'Too many requests from this IP — tactical rate limit active' }
});
app.use('/api/', apiLimiter);

/**
 * 🔥 GET /api/heatmap
 * Real Elasticsearch query for heatmap data.
 */
app.get('/api/heatmap', async (req, res) => {
    try {
        const result = await esClient.search({
            index: 'sector7-incidents',
            body: { query: { range: { timestamp: { gte: 'now-24h' } } }, size: 200, _source: ['position'] }
        });
        if (result.hits && result.hits.hits) {
            const points = result.hits.hits.map(h => [h._source.position[0], h._source.position[1], 0.8]);
            return res.json({ points });
        }
        res.json({ points: [] });
    } catch (e) {
        res.json({ points: [] });
    }
});

/**
 * 🔓 PATCH /api/resolve/:incidentId
 * Releases the locked tactical vehicle back to available status.
 */
app.patch('/api/resolve/:incidentId', ClerkExpressWithAuth(), async (req, res) => {
    const { vehicleId } = req.body;
    try {
        await db.ref(`incidents/${req.params.incidentId}`).update({
            status: 'resolved',
            resolvedAt: new Date().toISOString()
        });
        if (vehicleId) {
            await db.ref(`vehicles/${vehicleId}`).update({ status: 'Available', targetIncident: null });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Resolution failed' });
    }
});

/**
 * 🏎️ GET /api/vehicles
 * Returns the live tactical feed of all responders from Firebase.
 */
app.get('/api/vehicles', async (req, res) => {
    try {
        const snapshot = await db.ref('vehicles').once('value');
        res.json(snapshot.val() || {});
    } catch (error) {
        res.status(500).json({ error: 'Tactical Feed Offline' });
    }
});

/**
 * 🛰️ HYBRID BRIDGE - Incident Routing
 * 1. Authenticate with Clerk
 * 2. Send to Python (Gemini AI Analysis)
 * 3. Update Firebase (Real-time Tactical Feed)
 */
app.post('/api/report', ClerkExpressWithAuth(), async (req, res) => {
  if (process.env.ENFORCE_AUTH && !req.auth.userId) return res.status(401).json({ error: 'Unauthorized Session' });

  const ReportSchema = z.object({
      description: z.string().min(5).max(1000),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional()
  });
  
  const parsed = ReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const { description, lat, lng } = parsed.data;

  try {
    // A. 🔥 Call Python Worker (Gemini Analysis)
    console.log(`[NODE] Relaying report to Python Neural Core...`);
    const aiResponse = await axios.post(PYTHON_AI_URL, { description });
    const tacticalData = aiResponse.data;

    // B. 🛰️ SMART ASSIGNMENT (Find Nearest Responder)
    let assignedVehicleId = 'PD-BASE';
    let predictedEta = 'Unknown';
    
    try {
        const vehiclesSnapshot = await db.ref('vehicles').once('value');
        const vehicles = vehiclesSnapshot.val() || {};
        let minDistance = Infinity;

        // 🧮 Haversine Formula — accurate great-circle distance in km
        const toRad = (deg) => deg * (Math.PI / 180);
        const haversine = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Earth radius in km
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        for (const id in vehicles) {
            const v = vehicles[id];
            // Match vehicle type to incident requirements from AI
            if (tacticalData.vehicles_required.includes(v.type) && v.status !== 'Responding') {
                const distKm = haversine(
                    v.position[0], v.position[1],
                    lat || 17.5234, lng || 78.6681
                );
                if (distKm < minDistance) {
                    minDistance = distKm;
                    assignedVehicleId = id;
                    // ETA at avg emergency speed 40 km/h → minutes
                    const etaMin = Math.ceil((distKm / 40) * 60);
                    predictedEta = `${etaMin}m`;
                }
            }
        }
    } catch (assignError) {
        console.warn("[NODE] Smart Assignment Fault:", assignError.message);
    }


    // C. 📡 BroadCast to Tactical Grid (Firebase)
    const ref = db.ref('incidents').push();
    const entry = {
        id: ref.key,
        ...tacticalData,
        description,
        position: [lat || 17.5234, lng || 78.6681],
        assigned_vehicle: assignedVehicleId,
        eta: predictedEta,
        reportedBy: req.auth.userId || 'GUEST',
        timestamp: new Date().toISOString()
    };
    await ref.set(entry);
    
    // Update Vehicle Status (Tactical Lock)
    if (assignedVehicleId !== 'PD-BASE') {
        await db.ref(`vehicles/${assignedVehicleId}`).update({ status: 'Responding', targetIncident: ref.key });
    }


    // C. 📊 Index for Analytics (Elasticsearch)
    try {
        await esClient.index({
            index: 'sector7-incidents',
            document: entry
        });
        console.log(`[NODE] Logged to Sector 7 Analytics: ${ref.key}`);
    } catch (esError) {
        console.warn("[NODE] Analytics indexing fault (skipping):", esError.message);
    }

    // D. 🔄 Automation (Trigger n8n workflow for High Severity)
    if (tacticalData.severity === 'high' && process.env.N8N_WEBHOOK_URL) {
        try {
            console.log(`[NODE] Triggering Automated Response Workflow for high-severity crisis...`);
            axios.post(process.env.N8N_WEBHOOK_URL, entry);
        } catch (n8nError) {
            console.warn("[NODE] Automation trigger fault:", n8nError.message);
        }
    }

    // E. 🛰️ Event Bus (Pub/Sub)
    try {
        const dataBuffer = Buffer.from(JSON.stringify(entry));
        await pubsub.topic(TOPIC_NAME).publishMessage({ data: dataBuffer });
        console.log(`[NODE] Published to Tactical Bus: ${ref.key}`);
    } catch (busError) {
        console.warn("[NODE] Pub/Sub broadcast fault:", busError.message);
    }

    res.status(201).json({ success: true, tacticalData: entry });
  } catch (error) {


    console.error('[HYBRID ERROR] Tactical Link Break:', error.message);
    res.status(500).json({ error: 'AI Bridge Failure - Sector 7 Offline' });
  }
});

app.listen(PORT, () => {
    console.log(`\n🌌 Node Hybrid Gateway Active on Port ${PORT}`);
    console.log(`🚀 API: http://localhost:${PORT}/api/report`);
});
