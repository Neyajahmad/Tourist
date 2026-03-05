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
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } })

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tourist_safety')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err))

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


// Active users tracking
const activeUsers = new Map();

io.on('connection', socket => {
  socket.on('join', (userId) => {
    activeUsers.set(userId, socket.id);
    io.emit('activeUsers', Array.from(activeUsers.keys()));
  });

  socket.on('disconnect', () => {
    let disconnectedUser = null;
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUser = userId;
        activeUsers.delete(userId);
        break;
      }
    }
    if (disconnectedUser) {
      io.emit('activeUsers', Array.from(activeUsers.keys()));
    }
  });

  socket.on('locationUpdate', data => {
    io.emit('touristLocation', data)
  })
  socket.on('sosTrigger', data => {
    io.emit('sosAlert', data)
  })
  socket.on('adminMessage', payload => {
    const to = payload && payload.toUserId
    if (!to) return
    const sid = activeUsers.get(to)
    if (sid) {
      io.to(sid).emit('adminMessage', {
        type: payload.type,
        text: payload.text,
        audio: payload.audio
      })
    }
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

;(async () => {
  let port = parseInt(process.env.PORT || 5000, 10)
  while (true) {
    try {
      await new Promise((resolve, reject) => {
        const onError = (e) => reject(e)
        server.once('error', onError)
        server.listen(port, () => {
          server.off('error', onError)
          resolve()
        })
      })
      console.log(`Server running on port ${port}`)
      break
    } catch (e) {
      if (e && e.code === 'EADDRINUSE') {
        port += 1
        continue
      } else {
        throw e
      }
    }
  }
})()
