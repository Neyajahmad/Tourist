from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI()
base_dir = os.path.dirname(__file__)
candidates = [
    os.path.join(base_dir, "tourist_risk_model.pkl"),
    os.path.join(base_dir, "..", "tourist_risk_model.pkl"),
    "tourist_risk_model.pkl",
]
model_path = next((p for p in candidates if os.path.exists(p)), None)
model = joblib.load(model_path) if model_path else None

class RiskRequest(BaseModel):
    speed: float
    movement_gap: float
    area_risk: int
    time_hour: float

@app.get("/")
def home():
    return {"message": "AI Risk Detection Service Running"}

@app.head("/")
def head_home():
    return None

@app.post("/predict")
def predict_risk(data: RiskRequest):
    if model is None:
        return {"error": "Model not loaded"}
    features = pd.DataFrame([{
        "speed": data.speed,
        "movement_gap": data.movement_gap,
        "area_risk": data.area_risk,
        "time_hour": data.time_hour
    }])
    pred = model.predict(features)[0]
    probs = model.predict_proba(features)[0]
    score = int(probs[pred] * 100)
    label = {0: "Safe", 1: "Warning", 2: "Emergency"}.get(int(pred), "Unknown")
    return {"risk_label": label, "risk_score": score, "prediction_code": int(pred)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
