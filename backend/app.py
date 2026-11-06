"""Flask backend: web-application layer + prediction API + database layer."""
import datetime as dt
import json
import os
import sqlite3
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, g, jsonify, request
from flask_cors import CORS

import train_model
from features import CATEGORIES, CHANNELS, engineer, explain

BASE = Path(__file__).parent
MODEL_PATH, METRICS_PATH, DB_PATH = BASE / "model.pkl", BASE / "metrics.json", BASE / "fraud.db"
FRAUD_THRESHOLD = 0.5

app = Flask(__name__)
CORS(app, origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","))

# ---------- model serving layer ----------
if not MODEL_PATH.exists():
    print("No trained model found - training one now ...")
    train_model.train()
model = joblib.load(MODEL_PATH)


def risk_level(p: float) -> str:
    return "high" if p >= 0.7 else "medium" if p >= 0.35 else "low"


# ---------- database layer ----------
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_):
    db = g.pop("db", None)
    if db:
        db.close()


with sqlite3.connect(DB_PATH) as _c:
    _c.execute("""CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL,
        amount REAL, hour INTEGER, merchant_category TEXT, channel TEXT,
        distance_from_home_km REAL, international INTEGER, txn_count_24h REAL,
        avg_txn_amount REAL, probability REAL, label TEXT, risk_level TEXT, reasons TEXT)""")


# ---------- validation ----------
def _num(data, key, errors, required=False, minimum=0.0, integer=False):
    raw = data.get(key)
    if raw in (None, ""):
        if required:
            errors[key] = "This field is required"
        return None
    try:
        val = float(raw)
    except (TypeError, ValueError):
        errors[key] = "Must be a number"
        return None
    if val < minimum or (key == "amount" and val <= 0):
        errors[key] = "Value is out of range"
    return int(val) if integer else val


def parse_payload(data):
    errors = {}
    clean = {
        "amount": _num(data, "amount", errors, required=True),
        "hour": _num(data, "hour", errors, required=True, integer=True),
        "distance_from_home_km": _num(data, "distance_from_home_km", errors),
        "txn_count_24h": _num(data, "txn_count_24h", errors),
        "avg_txn_amount": _num(data, "avg_txn_amount", errors),
        "merchant_category": data.get("merchant_category"),
        "channel": data.get("channel"),
        "international": 1 if str(data.get("international")).lower() in ("1", "true", "yes") else 0,
    }
    if clean["hour"] is not None and not 0 <= clean["hour"] <= 23:
        errors["hour"] = "Hour must be between 0 and 23"
    if clean["merchant_category"] not in CATEGORIES:
        errors["merchant_category"] = "Unknown category"
    if clean["channel"] not in CHANNELS:
        errors["channel"] = "Unknown channel"
    return clean, errors


# ---------- routes ----------
@app.get("/api/health")
def health():
    return jsonify(status="ok", model_loaded=True)


@app.get("/api/options")
def options():
    return jsonify(categories=CATEGORIES, channels=CHANNELS)


@app.post("/api/predict")
def predict():
    clean, errors = parse_payload(request.get_json(silent=True) or {})
    if errors:
        return jsonify(error="Invalid input", fields=errors), 400

    prob = float(model.predict_proba(engineer(pd.DataFrame([clean])))[0][1])
    label = "Fraudulent" if prob >= FRAUD_THRESHOLD else "Legitimate"
    level, reasons = risk_level(prob), explain(clean)

    db = get_db()
    cur = db.execute(
        """INSERT INTO transactions (created_at, amount, hour, merchant_category, channel,
           distance_from_home_km, international, txn_count_24h, avg_txn_amount,
           probability, label, risk_level, reasons) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (dt.datetime.now().isoformat(timespec="seconds"), clean["amount"], clean["hour"],
         clean["merchant_category"], clean["channel"], clean["distance_from_home_km"],
         clean["international"], clean["txn_count_24h"], clean["avg_txn_amount"],
         prob, label, level, json.dumps(reasons)))
    db.commit()
    return jsonify(id=cur.lastrowid, label=label, probability=round(prob, 4),
                   risk_level=level, reasons=reasons)


@app.get("/api/transactions")
def transactions():
    limit = min(request.args.get("limit", 25, type=int), 200)
    label = request.args.get("label")
    sql, params = "SELECT * FROM transactions", []
    if label in ("Fraudulent", "Legitimate"):
        sql += " WHERE label = ?"
        params.append(label)
    rows = get_db().execute(sql + " ORDER BY id DESC LIMIT ?", params + [limit]).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["reasons"] = json.loads(d["reasons"] or "[]")
        out.append(d)
    return jsonify(out)


@app.delete("/api/transactions")
def clear_transactions():
    db = get_db()
    db.execute("DELETE FROM transactions")
    db.commit()
    return jsonify(ok=True)


@app.get("/api/stats")
def stats():
    db = get_db()
    total, fraud, avg_amt = db.execute(
        "SELECT COUNT(*), COALESCE(SUM(label='Fraudulent'),0), COALESCE(AVG(amount),0) FROM transactions"
    ).fetchone()
    by_cat = db.execute(
        """SELECT merchant_category AS category,
                  SUM(label='Legitimate') AS legitimate, SUM(label='Fraudulent') AS fraudulent
           FROM transactions GROUP BY merchant_category ORDER BY COUNT(*) DESC""").fetchall()
    since = (dt.date.today() - dt.timedelta(days=13)).isoformat()
    daily = {r["day"]: r for r in db.execute(
        """SELECT substr(created_at,1,10) AS day, SUM(label='Legitimate') AS legitimate,
                  SUM(label='Fraudulent') AS fraudulent
           FROM transactions WHERE day >= ? GROUP BY day""", (since,))}
    timeline = []
    for i in range(14):
        day = (dt.date.today() - dt.timedelta(days=13 - i)).isoformat()
        r = daily.get(day)
        timeline.append({"date": day[5:], "legitimate": r["legitimate"] if r else 0,
                         "fraudulent": r["fraudulent"] if r else 0})
    risk = {r["risk_level"]: r["n"] for r in db.execute(
        "SELECT risk_level, COUNT(*) AS n FROM transactions GROUP BY risk_level")}
    return jsonify(total=total, fraudulent=fraud, legitimate=total - fraud,
                   fraud_rate=round(fraud / total, 4) if total else 0,
                   avg_amount=round(avg_amt, 2),
                   by_category=[dict(r) for r in by_cat], timeline=timeline,
                   risk={"low": risk.get("low", 0), "medium": risk.get("medium", 0),
                         "high": risk.get("high", 0)})


@app.get("/api/model-info")
def model_info():
    return jsonify(json.loads(METRICS_PATH.read_text()) if METRICS_PATH.exists() else {})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)
