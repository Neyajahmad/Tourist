const axios = require('axios')
const Incident = require('../models/Incident')
const { reportIncident } = require('../blockchain')

exports.checkRisk = async (req, res) => {
    try {
        const { speed, movement_gap, area_risk, time_hour, lat, lng, touristId } = req.body
        let risk_level = 'UNKNOWN'
        let risk_score = 0

        try {
            const aiUrl = process.env.AI_SERVICE_URL || 'https://tourist-ai-service.onrender.com/predict'
            const aiResponse = await axios.post(aiUrl, { speed, movement_gap, area_risk, time_hour })
            if (aiResponse.data) {
                risk_level = aiResponse.data.risk_level || 'UNKNOWN'
                risk_score = aiResponse.data.risk_score || 0
            }
        } catch (err) {
            console.error('AI Service Error:', err.message)
        }

        if (risk_level === 'HIGH' || risk_level === 'CRITICAL' || risk_level === 'Emergency' || risk_level === 'Warning') {
            const incident = new Incident({ touristId, location: { lat, lng }, type: risk_level, riskScore: risk_score, status: 'Open' })
            await incident.save()
            try { await reportIncident(`${lat},${lng}`, risk_level) } catch (err) {
                console.error('Blockchain Report Error:', err.message)
            }
        }

        res.json({ risk_score, risk_level })
    } catch (error) {
        console.error('Check Risk Error:', error.message)
        res.status(500).json({ error: error.message })
    }
}
