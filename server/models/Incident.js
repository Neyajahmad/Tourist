const mongoose = require('mongoose')

const IncidentSchema = new mongoose.Schema({
  touristId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: { lat: Number, lng: Number },
  type: { type: String, default: 'SOS' },
  riskScore: Number,
  status: { type: String, enum: ['Open', 'Verified', 'Resolved'], default: 'Open' },
  timestamp: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Incident', IncidentSchema)
