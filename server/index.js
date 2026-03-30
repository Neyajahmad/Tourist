const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const dotenv = require('dotenv')
const authRoutes = require('./routes/auth')
const incidentRoutes = require('./routes/incident')

dotenv.config()

const app = express()
const server = http.createServer(app)
// const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } })

const io = new Server(server, { 
  cors: { 
    origin: '*', 
    methods: ['GET', 'POST'] 
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
})


app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tourist_safety')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err))

// Health check route for uptime monitoring (UptimeRobot, Render, etc.)
// Supports both GET and HEAD requests
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running 🚀',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// HEAD request support for UptimeRobot (responds immediately without body)
app.head('/', (req, res) => {
  res.status(200).end()
})

// Health check endpoint (alternative) - supports GET and HEAD
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Net2Vision API is operational',
    timestamp: new Date().toISOString()
  })
})

app.head('/health', (req, res) => {
  res.status(200).end()
})

app.use('/api/auth', authRoutes)
app.use('/api/incidents', incidentRoutes)

// Map data: restricted zones, crowded areas, landmarks, alerts (demo/static)
app.get('/api/geo/map-data', (req, res) => {
  // Demo coordinates near London (same as default map center)
  const base = { lat: 51.505, lng: -0.09 }
  res.json({
    restrictedZones: [
      { id: 'rz1', center: { lat: base.lat + 0.010, lng: base.lng + 0.005 }, radius: 600, name: 'Construction Site' },
      { id: 'rz2', center: { lat: base.lat - 0.008, lng: base.lng - 0.006 }, radius: 800, name: 'Military Area' }
    ],
    crowdedAreas: [
      { id: 'ca1', center: { lat: base.lat + 0.006, lng: base.lng - 0.012 }, radius: 500, crowdLevel: 'high', name: 'Tourist Hotspot' }
    ],
    landmarks: [
      { id: 'lm1', name: 'City Museum', location: { lat: base.lat + 0.004, lng: base.lng + 0.004 } },
      { id: 'lm2', name: 'Central Park', location: { lat: base.lat - 0.005, lng: base.lng - 0.002 } }
    ],
    weatherAlerts: [
      { id: 'wa1', message: 'Heat advisory in effect', severity: 'moderate' }
    ],
    emergencyUpdates: [
      { id: 'eu1', message: 'Road closure near Construction Site', severity: 'high' }
    ]
  })
})


// Active users and SOS tracking
const activeUsers = new Map();
const activeSOS = new Map(); // userId -> SOS data

io.on('connection', socket => {
  socket.on('join', (userId) => {
    // Remove any existing associations for this socket first
    for (const [uid, sid] of activeUsers.entries()) {
      if (sid === socket.id) {
        activeUsers.delete(uid);
      }
    }
    
    socket.join(userId); // Join room for private messages
    activeUsers.set(userId, socket.id);
    io.emit('activeUsers', Array.from(activeUsers.keys()));
  });

  socket.on('leave', (userId) => {
    if (userId) {
      activeUsers.delete(userId);
      socket.leave(userId);
      io.emit('activeUsers', Array.from(activeUsers.keys()));
    }
  });

  socket.on('requestActiveUsers', () => {
    socket.emit('activeUsers', Array.from(activeUsers.keys()));
  });

  socket.on('requestActiveSOS', () => {
    socket.emit('activeSOSList', Array.from(activeSOS.values()));
  });

  socket.on('disconnect', () => {
    let removedAny = false;
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        removedAny = true;
      }
    }
    if (removedAny) {
      io.emit('activeUsers', Array.from(activeUsers.keys()));
    }
  });

  socket.on('locationUpdate', data => {
    io.emit('touristLocation', data)
  })

  // Allowed areas for SOS (Sync with frontend)
  const allowedAreas = [
    { name: "Delhi", lat: 28.6139, lng: 77.2090, radius: 50000 },
    { name: "Lovely Professional University", lat: 31.2536, lng: 75.7056, radius: 5000 },
    { name: "Amritsar", lat: 31.6340, lng: 74.8723, radius: 30000 }
  ];

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  socket.on('sosTrigger', data => {
    const { lat, lng } = data.location || {};
    const userId = data.userId;
    
    let matchedArea = allowedAreas.find(area => {
      const distance = getDistance(lat, lng, area.lat, area.lng);
      return distance <= area.radius;
    });

    if (matchedArea) {
      const now = new Date();
      let sosData = activeSOS.get(userId);

      // Check for duplicate within 5 mins
      if (sosData && (now - new Date(sosData.time)) < 5 * 60 * 1000) {
        sosData.count = (sosData.count || 1) + 1;
        sosData.time = now;
        sosData.updatedAt = now; // Add updatedAt for sorting
        sosData.location = data.location; // update latest
      } else {
        sosData = {
          ...data,
          id: userId + '-' + Date.now(),
          area: matchedArea.name,
          count: 1,
          status: 'pending',
          time: now,
          updatedAt: now
        };
      }
      
      activeSOS.set(userId, sosData);
      io.emit('sosAlert', sosData);
      
      // Auto-response to user
      socket.emit('adminMessage', {
        type: 'text',
        text: `SOS Received. Help is on the way to your location in ${matchedArea.name}. Please stay calm.`
      });
    } else {
      console.warn(`Blocked SOS from restricted location: ${lat}, ${lng}`);
      socket.emit('sosBlocked', { message: 'SOS blocked: Location not supported' });
    }
  })

  socket.on('updateSosStatus', ({ userId, status }) => {
    const sos = activeSOS.get(userId);
    if (sos) {
      sos.status = status;
      if (status === 'resolved') {
        activeSOS.delete(userId);
      } else {
        activeSOS.set(userId, sos);
      }
      io.emit('sosStatusUpdated', { userId, status });
      
      // Notify the specific user about the status change
      const sid = activeUsers.get(userId);
      if (sid) {
        let msg = status === 'in_progress' ? 'An admin is currently responding to your SOS.' : 'Your SOS alert has been marked as resolved.';
        io.to(sid).emit('adminMessage', { type: 'text', text: msg });
      }
    }
  });

  socket.on('broadcastMessage', ({ target, message, area }) => {
    if (target === 'all') {
      io.emit('adminMessage', { type: 'text', text: `BROADCAST: ${message}` });
    } else if (target === 'area' && area) {
      for (const [uid, sos] of activeSOS.entries()) {
        if (sos.area === area) {
          const sid = activeUsers.get(uid);
          if (sid) {
            io.to(sid).emit('adminMessage', { type: 'text', text: `AREA BROADCAST (${area}): ${message}` });
          }
        }
      }
    }
  });

  socket.on('adminMessage', payload => {
    const to = payload && payload.toUserId
    if (!to) return
    
    // Send to specific user room for instant delivery
    io.to(to).emit('adminMessage', {
      type: payload.type,
      text: payload.text,
      audio: payload.audio,
      time: Date.now()
    })
    
    console.log(`Admin message emitted to room: ${to}`);
  })
  socket.on('userMessage', payload => {
    io.emit('userMessage', {
      fromUserId: payload?.fromUserId,
      type: payload?.type,
      text: payload?.text,
      audio: payload?.audio,
      time: Date.now()
    })
  })
})

// Global error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 handler for undefined routes (must be last)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path
  })
})

// Start server with proper error handling
const PORT = process.env.PORT || 5001

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`✅ Health check available at: http://localhost:${PORT}/`)
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`)
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message)
  process.exit(1)
})
