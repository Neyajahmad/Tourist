const express = require('express')
const Incident = require('../models/Incident')
const { verifyIncident } = require('../blockchain')
const { checkRisk } = require('../controllers/incidentController')
const router = express.Router()

router.post('/check-risk', checkRisk)

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
