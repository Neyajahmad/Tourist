import pandas as pd
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

def train():
    csv_path = os.path.join(os.path.dirname(__file__), "..", "preprocessed_tourist_data (2).csv")
    df = pd.read_csv(csv_path)
    X = df[["speed", "movement_gap", "area_risk", "hour"]].rename(columns={"hour": "time_hour"})
    y = df["label"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    acc = accuracy_score(y_test, clf.predict(X_test))
    print(f"Accuracy: {acc*100:.2f}%")
    joblib.dump(clf, "tourist_risk_model.pkl")
    print("Saved model to tourist_risk_model.pkl")

if __name__ == "__main__":
    train()
