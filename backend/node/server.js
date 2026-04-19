const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { MongoClient, ObjectId } = require('mongodb');
const { Groq } = require('groq-sdk');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.NODE_PORT || process.env.PORT || 5000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const DB_NAME = process.env.MONGODB_DB_NAME || 'sector7';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sector7';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const ENFORCE_AUTH = ['1', 'true', 'yes', 'on'].includes(
  String(process.env.ENFORCE_AUTH || '').trim().toLowerCase()
);
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

// Allowed CORS origins: comma-separated env var, fallback to localhost for dev
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const io = new Server(server, {
  cors: {
    origin: IS_PROD ? ALLOWED_ORIGINS : '*',
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  }
});

const mongoClient = new MongoClient(MONGODB_URI, {
  maxPoolSize: 20,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000
});

let db;
let incidentsCollection;
let vehiclesCollection;
let dbReady = false;
let vehiclesPollingHandle;
let incidentsPollingHandle;
let incidentStream;

function requireAuthIfEnabled(req, res, next) {
  if (!ENFORCE_AUTH) {
    req.auth = req.auth || { userId: null };
    return next();
  }

  if (!CLERK_SECRET_KEY) {
    return res.status(500).json({ error: 'Authentication is enabled but CLERK_SECRET_KEY is missing' });
  }

  return ClerkExpressWithAuth()(req, res, next);
}

function ensureDbReady(req, res, next) {
  if (!dbReady || !incidentsCollection || !vehiclesCollection) {
    return res.status(503).json({ error: 'Backend is still connecting to MongoDB' });
  }

  return next();
}

function formatIncidentMap(incidentsData) {
  return incidentsData.reduce((acc, inc) => {
    acc[inc._id.toString()] = inc;
    return acc;
  }, {});
}

function formatVehicleMap(vehiclesData) {
  return vehiclesData.reduce((acc, vehicle) => {
    acc[vehicle.id] = vehicle;
    return acc;
  }, {});
}

async function emitVehiclesUpdate() {
  if (!vehiclesCollection) return;
  const vehiclesData = await vehiclesCollection.find({}).toArray();
  io.emit('vehicles_update', formatVehicleMap(vehiclesData));
}

async function emitIncidentsUpdate() {
  if (!incidentsCollection) return;
  const incidentsData = await incidentsCollection.find({}).toArray();
  io.emit('incidents_update', formatIncidentMap(incidentsData));
}

function startRealtimeBroadcasts() {
  if (!vehiclesPollingHandle) {
    vehiclesPollingHandle = setInterval(async () => {
      try {
        await emitVehiclesUpdate();
      } catch (error) {
        console.warn('Vehicle polling failed:', error.message);
      }
    }, 1000);
  }

  try {
    incidentStream = incidentsCollection.watch([], { fullDocument: 'updateLookup' });
    incidentStream.on('change', async () => {
      try {
        await emitIncidentsUpdate();
      } catch (error) {
        console.warn('Incident watch update failed:', error.message);
      }
    });
    incidentStream.on('error', (error) => {
      console.warn('Incident watch stream failed, falling back to polling:', error.message);
      if (!incidentsPollingHandle) {
        incidentsPollingHandle = setInterval(async () => {
          try {
            await emitIncidentsUpdate();
          } catch (pollError) {
            console.warn('Incident polling failed:', pollError.message);
          }
        }, 2000);
      }
    });
  } catch (error) {
    console.warn('Could not start MongoDB change stream, falling back to polling:', error.message);
    if (!incidentsPollingHandle) {
      incidentsPollingHandle = setInterval(async () => {
        try {
          await emitIncidentsUpdate();
        } catch (pollError) {
          console.warn('Incident polling failed:', pollError.message);
        }
      }, 2000);
    }
  }
}

async function connectDB() {
  await mongoClient.connect();
  await mongoClient.db('admin').command({ ping: 1 });

  db = mongoClient.db(DB_NAME);
  incidentsCollection = db.collection('incidents');
  vehiclesCollection = db.collection('vehicles');
  dbReady = true;

  console.log(`Connected to MongoDB database "${DB_NAME}"`);
  startRealtimeBroadcasts();
}

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// --- Security & Middleware ---
// Trust the first proxy (required for rate-limiting behind Docker / Render / Vercel)
app.set('trust proxy', 1);

// Security headers (relax CSP for SSE / Socket.io in dev)
app.use(helmet({
  contentSecurityPolicy: IS_PROD ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// Gzip compression for all responses
app.use(compression());

// Request logging (compact in prod, verbose in dev)
app.use(morgan(IS_PROD ? 'combined' : 'dev'));

// CORS — locked to ALLOWED_ORIGINS in production
app.use(cors({
  origin: IS_PROD ? ALLOWED_ORIGINS : '*',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting on all /api/ routes
app.use(
  '/api/',
  rateLimit({
    windowMs: 60 * 1000,
    max: IS_PROD ? 60 : 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP. Please retry shortly.' }
  })
);

app.get('/', (req, res) => {
  res.status(200).json({
    service: 'sector7-node-gateway',
    status: dbReady ? 'online' : 'starting',
    environment: NODE_ENV,
    endpoints: ['/health', '/api/heatmap', '/api/incidents', '/api/report', '/api/vehicles']
  });
});

app.get('/health', async (req, res) => {
  try {
    if (!dbReady) {
      return res.status(503).json({ status: 'starting', database: 'disconnected' });
    }

    await mongoClient.db('admin').command({ ping: 1 });
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      auth: ENFORCE_AUTH ? 'enabled' : 'disabled',
      ai: groq ? 'configured' : 'missing_api_key'
    });
  } catch (error) {
    return res.status(503).json({
      status: 'degraded',
      database: 'unreachable',
      error: error.message
    });
  }
});

app.get('/api/heatmap', ensureDbReady, async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const results = await incidentsCollection.find({ timestamp: { $gte: oneDayAgo } }).toArray();
    const points = results.map((incident) => [incident.position?.[0], incident.position?.[1], 0.8]).filter(Boolean);
    res.json({ points });
  } catch (error) {
    console.error('Heatmap query failed:', error.message);
    res.status(500).json({ error: 'Unable to load heatmap data', points: [] });
  }
});

app.get('/api/incidents', ensureDbReady, async (req, res) => {
  try {
    const incidents = await incidentsCollection.find({}).sort({ timestamp: -1 }).limit(200).toArray();
    res.json(formatIncidentMap(incidents));
  } catch (error) {
    console.error('Incident fetch failed:', error.message);
    res.status(500).json({ error: 'Unable to load incidents' });
  }
});

app.get('/api/vehicles', ensureDbReady, async (req, res) => {
  try {
    const vehiclesArray = await vehiclesCollection.find({}).toArray();
    res.json(formatVehicleMap(vehiclesArray));
  } catch (error) {
    console.error('Vehicle fetch failed:', error.message);
    res.status(500).json({ error: 'Tactical feed offline' });
  }
});

app.patch('/api/resolve/:incidentId', ensureDbReady, requireAuthIfEnabled, async (req, res) => {
  const { vehicleId } = req.body || {};

  try {
    const incidentId = new ObjectId(req.params.incidentId);
    await incidentsCollection.updateOne(
      { _id: incidentId },
      { $set: { status: 'resolved', resolvedAt: new Date().toISOString() } }
    );

    if (vehicleId) {
      await vehiclesCollection.updateOne(
        { id: vehicleId },
        { $set: { status: 'Available', targetIncident: null } }
      );
    }

    await emitIncidentsUpdate();
    await emitVehiclesUpdate();
    res.json({ success: true });
  } catch (error) {
    console.error('Incident resolution failed:', error.message);
    res.status(500).json({ error: 'Resolution failed' });
  }
});

async function analyzeIncidentWithGroq(description) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const prompt = `Act as a Tactical Emergency Triage AI for Sector 7 Disaster Command.
Analyze this report: "${description}"
Respond ONLY in valid JSON with these fields:
- type (fire/medical/accident/flood/chemical)
- severity (low/medium/high/critical)
- vehicles_required (array of strings such as firetruck, police, ambulance)
- action (short string)
- confidence (0.0-1.0)
- escalation_risk (low/medium/high)`;

  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: process.env.GROQ_MODEL || 'llama3-8b-8192',
    response_format: { type: 'json_object' },
    temperature: 0.2
  });

  return JSON.parse(response.choices[0].message.content);
}

app.post('/api/report-analyze', async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: 'Description required' });
  try {
    const analysis = await analyzeIncidentWithGroq(description);
    res.json({ ...analysis, ai_engine: 'groq-failsafe' });
  } catch (err) {
    console.error('Groq failsafe failed:', err.message);
    res.status(500).json({ error: 'Failsafe inference failed' });
  }
});

app.post('/api/report', ensureDbReady, requireAuthIfEnabled, async (req, res) => {
  const reportSchema = z.object({
    description: z.string().trim().min(5).max(1000),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    preAnalyzed: z.any().optional(),
    photoUrl: z.string().optional()
  });

  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { description, lat, lng, preAnalyzed, photoUrl } = parsed.data;

  try {
    const tacticalData = preAnalyzed || await analyzeIncidentWithGroq(description);

    const vehiclesArray = await vehiclesCollection.find({}).toArray();
    const availableVehicles = vehiclesArray.filter((vehicle) => vehicle.status !== 'Responding');
    const assignedVehicles = [];
    const predictedEtas = [];

    const toRad = (degrees) => degrees * (Math.PI / 180);
    const haversine = (lat1, lon1, lat2, lon2) => {
      const earthRadiusKm = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    for (const requiredType of tacticalData.vehicles_required || []) {
      let minDistance = Infinity;
      let bestVehicle = null;

      for (const vehicle of availableVehicles) {
        if (vehicle.type === requiredType && !assignedVehicles.includes(vehicle.id)) {
          const distKm = haversine(vehicle.position[0], vehicle.position[1], lat || 17.5234, lng || 78.6681);
          if (distKm < minDistance) {
            minDistance = distKm;
            bestVehicle = vehicle;
          }
        }
      }

      if (bestVehicle) {
        assignedVehicles.push(bestVehicle.id);
        predictedEtas.push(`${Math.ceil((minDistance / 40) * 60)}m`);
      }
    }

    const entry = {
      ...tacticalData,
      description,
      position: [lat || 17.5234, lng || 78.6681],
      assigned_vehicle: assignedVehicles.length > 0 ? assignedVehicles.join(', ') : 'UNASSIGNED',
      eta: predictedEtas.length > 0 ? predictedEtas.join(', ') : 'Unknown',
      reportedBy: req.auth?.userId || 'anonymous',
      status: 'active',
      photoUrl: photoUrl || null,
      timestamp: new Date().toISOString()
    };

    const result = await incidentsCollection.insertOne(entry);
    entry._id = result.insertedId;

    if (assignedVehicles.length > 0) {
      await vehiclesCollection.updateMany(
        { id: { $in: assignedVehicles } },
        { $set: { status: 'Responding', targetIncident: result.insertedId.toString() } }
      );
    }

    if (
      ['high', 'critical'].includes(String(tacticalData.severity || '').toLowerCase()) &&
      N8N_WEBHOOK_URL
    ) {
      try {
        await axios.post(N8N_WEBHOOK_URL, entry, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
      } catch (error) {
        console.warn('n8n webhook failed:', error.message);
      }
    }

    await emitIncidentsUpdate();
    await emitVehiclesUpdate();
    res.status(201).json({ success: true, tacticalData: entry });
  } catch (error) {
    console.error('Incident report failed:', error.message);
    res.status(500).json({ error: 'AI bridge failure - report could not be processed' });
  }
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down services...`);

  if (vehiclesPollingHandle) clearInterval(vehiclesPollingHandle);
  if (incidentsPollingHandle) clearInterval(incidentsPollingHandle);
  if (incidentStream) {
    try {
      await incidentStream.close();
    } catch (error) {
      console.warn('Failed to close incident stream cleanly:', error.message);
    }
  }

  try {
    await mongoClient.close();
  } catch (error) {
    console.warn('Failed to close MongoDB client cleanly:', error.message);
  }

  server.close(() => process.exit(0));
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

// Catch unhandled promise rejections to prevent silent failures
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error.message);
  process.exit(1);
});

connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Sector 7] Node Gateway ready — port ${PORT} — env: ${NODE_ENV}`);
      console.log(`[Sector 7] CORS origins: ${IS_PROD ? ALLOWED_ORIGINS.join(', ') : '* (dev)'}`);
      console.log(`[Sector 7] Auth enforcement: ${ENFORCE_AUTH ? 'ON' : 'OFF'}`);
      console.log(`[Sector 7] AI bridge: ${groq ? 'GROQ configured' : 'MISSING GROQ_API_KEY'}`);
    });
  })
  .catch((error) => {
    console.error('[FATAL] Failed to start backend:', error.message);
    process.exit(1);
  });
