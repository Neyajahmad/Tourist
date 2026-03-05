const axios = require("axios");

exports.checkRisk = async (req, res) => {
    try {
        const { speed, movement_gap, area_risk, time_hour } = req.body;

        const aiUrl = process.env.AI_SERVICE_URL || "https://tourist-1-z6z4.onrender.com/predict";

        const aiResponse = await axios.post(
            aiUrl,
            {
                speed: Number(speed) || 0,
                movement_gap: Number(movement_gap) || 0,
                area_risk: Number(area_risk) || 0,
                time_hour: Number(time_hour) || 0
            }
        );

        res.json(aiResponse.data);

    } catch (error) {
        console.error("AI Error:", error.message);

        res.status(200).json({
            risk_score: 0,
            risk_level: "UNKNOWN (AI ERROR)"
        });
    }
};
