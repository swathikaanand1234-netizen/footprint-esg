const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const seedDatabase = require('./seed/seedData');
const { safeErrorHandler } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

app.set('io', io);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: 'text/csv' }));

// Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'FootprintESG - Sustainability & Carbon Management API',
    timestamp: new Date().toISOString(),
    version: '1.0.0-mvp'
  });
});

// Auth Routes (v1 and backward-compatible)
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

// API Routes (v1 and backward-compatible /api)
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// Static Asset Serving (Unified Full-Stack Deployment on Render)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Safe Error Handler (FR-005)
app.use(safeErrorHandler);

// Socket.IO Room Management (FR-003, FR-016)
io.on('connection', (socket) => {
  // Client subscribes to an authorized facility room
  socket.on('subscribe:facility', (facilityId) => {
    if (facilityId && typeof facilityId === 'string') {
      const room = `facility:${facilityId}`;
      socket.join(room);
    }
  });

  socket.on('unsubscribe:facility', (facilityId) => {
    if (facilityId && typeof facilityId === 'string') {
      const room = `facility:${facilityId}`;
      socket.leave(room);
    }
  });
});

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/footprint_esg';

const startServer = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB successfully.');

    await seedDatabase();

    // Automated Continuous Telemetry Pulse (Smooth Adjacent Drift)
    let telemetryTimer = null;
    const startContinuousTelemetry = () => {
      if (telemetryTimer) return;
      const DataSource = require('./models/DataSource');
      const CurrentMeasurement = require('./models/CurrentMeasurement');
      const { getAdjacentTelemetryValue } = require('./routes/api');

      telemetryTimer = setInterval(async () => {
        try {
          if (!io || io.engine.clientsCount === 0) return;

          const sources = await DataSource.find();
          for (const src of sources) {
            const existing = await CurrentMeasurement.findOne({ sourceId: src.sourceId });
            const newVal = getAdjacentTelemetryValue(src.metric, existing ? existing.value : null);

            const snap = await CurrentMeasurement.findOneAndUpdate(
              { sourceId: src.sourceId },
              {
                $set: {
                  facilityId: src.facilityId,
                  metric: src.metric,
                  value: newVal,
                  unit: src.unit,
                  quality: 'GOOD',
                  sourceTimestamp: new Date(),
                  freshnessStatus: 'LIVE',
                  lastSeenAt: new Date()
                }
              },
              { upsert: true, new: true }
            );

            io.to(`facility:${src.facilityId}`).emit('telemetry:update', snap);
          }
        } catch (err) {
          // Keep background ticker silent on transient errors
        }
      }, 4000);
    };

    server.listen(PORT, () => {
      console.log(`FootprintESG API & Socket.IO Server listening on port ${PORT}`);
      startContinuousTelemetry();
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    server.listen(PORT, () => {
      console.log(`FootprintESG API Server listening (offline fallback) on port ${PORT}`);
    });
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io, startServer };
