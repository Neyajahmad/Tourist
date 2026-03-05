const express = require('express')
const axios = require('axios')
const Incident = require('../models/Incident')
const { reportIncident, verifyIncident } = require('../blockchain')
const router = express.Router()

router.post('/check-risk', async (req, res) => {
  try {
    const { speed, movement_gap, area_risk, time_hour, lat, lng, touristId } = req.body
    let riskLabel = 'Unknown'
    let riskScore = 0
    try {
      const aiResponse = await axios.post(process.env.AI_SERVICE_URL, { speed, movement_gap, area_risk, time_hour })
      riskLabel = aiResponse.data.risk_label
      riskScore = aiResponse.data.risk_score
    } catch {}
    if (riskLabel === 'Emergency' || riskLabel === 'Warning') {
      const incident = new Incident({ touristId, location: { lat, lng }, type: riskLabel, riskScore, status: 'Open' })
      await incident.save()
      try { await reportIncident(`${lat},${lng}`, riskLabel) } catch {}
    }
    res.json({ riskLabel, riskScore })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  const incidents = await Incident.find().populate('touristId', 'name')
  res.json(incidents)
})

router.post('/verify/:id', async (req, res) => {
  try {
    const { id } = req.params
    const inc = await Incident.findById(id)
    if (!inc) return res.status(404).json({ message: 'Not found' })
    await verifyIncident((await Incident.countDocuments()) - 1)
    inc.status = 'Verified'
    await inc.save()
    res.json({ message: 'Verified' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
