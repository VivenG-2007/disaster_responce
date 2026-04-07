require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const { Client } = require('@elastic/elasticsearch');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. 🔥 Firebase Admin Setup
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
const db = admin.database();

// 2. 📊 Elasticsearch Setup (Incident Analytics)
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    username: process.env.ELASTICSEARCH_USER,
    password: process.env.ELASTICSEARCH_PASS
  }
});

app.use(cors());
app.use(express.json());

/**
 * 📡 Health Check - Backend Neural Link
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', node: 'Mumbai-7', timestamp: new Date() });
});

/**
 * 🚨 Report New Incident (Secured via Clerk)
 */
app.post('/api/incidents', ClerkExpressWithAuth(), async (req, res) => {
  const { incident } = req.body;
  if (!req.auth.userId) return res.status(401).json({ error: 'Unauthorized Session' });

  try {
    // A. Store in Firebase (Realtime Tactical Feed)
    const newRef = db.ref('incidents').push();
    await newRef.set({ ...incident, reportedBy: req.auth.userId });

    // B. Index in Elasticsearch (24h Analytical Heatmap)
    await esClient.index({
      index: 'disaster-incidents',
      document: {
        ...incident,
        userId: req.auth.userId,
        timestamp: new Date()
      }
    });

    res.status(201).json({ success: true, id: newRef.key });
  } catch (error) {
    console.error('Neural Link Error:', error);
    res.status(500).json({ error: 'Failed to broadcast incident' });
  }
});

/**
 * 🔥 Tactical Heatmap Data (Last 24h from Elastic)
 */
app.get('/api/analytics/heatmap', async (req, res) => {
  try {
    const result = await esClient.search({
      index: 'disaster-incidents',
      body: {
        query: {
          range: {
            timestamp: { gte: 'now-24h' }
          }
        },
        size: 500
      }
    });

    const points = result.hits.hits.map(hit => [
      hit._source.position[0],
      hit._source.position[1],
      0.8 // Intensity
    ]);

    res.json(points);
  } catch (error) {
    console.error('Analytics Fault:', error);
    res.json([]); // Fallback to empty cluster
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Tactical Core Active on Port ${PORT}`);
  console.log(`📡 Secure Command Link: http://localhost:${PORT}`);
});
