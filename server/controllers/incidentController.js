const axios = require("axios");

exports.checkRisk = async (req, res) => {
    try {
        const { speed, movement_gap, area_risk, time_hour } = req.body;

        const aiResponse = await axios.post(
            process.env.AI_SERVICE_URL,
            {
                speed,
                movement_gap,
                area_risk,
                time_hour
            }
        );

        res.json(aiResponse.data);

    } catch (error) {
        console.error("AI Error:", error.message);

        res.status(500).json({
            risk_score: 0,
            risk_level: "UNKNOWN"
        });
    }
};
