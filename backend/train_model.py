"""Offline model training pipeline (architecture block #6).

Raw data -> preprocessing -> model training -> saved model (.pkl)

Usage:
    python train_model.py                  # trains on a synthetic dataset
    python train_model.py --csv data.csv   # trains on your own CSV
The CSV needs the columns listed in features.RAW plus an `is_fraud` (0/1) column.
"""
import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from features import BINARY, CATEGORICAL, CATEGORIES, NUMERIC, RAW, engineer

BASE = Path(__file__).parent


def generate_synthetic(n=20000, fraud_rate=0.08, seed=42) -> pd.DataFrame:
    """Create a realistic-looking transaction dataset with overlapping classes."""
    rng = np.random.default_rng(seed)
    y = rng.random(n) < fraud_rate
    nf, nl = int(y.sum()), int((~y).sum())

    legit_w = [.22, .14, .14, .08, .08, .07, .12, .05, .01, .09]
    fraud_w = [.03, .02, .03, .01, .04, .22, .22, .15, .15, .13]

    def block(size, fraud):
        return pd.DataFrame({
            "amount": rng.lognormal(np.log(8000 if fraud else 1200), 1.1 if fraud else 1.0, size).round(2),
            "hour": np.where(rng.random(size) < (0.6 if fraud else 0.04),
                             rng.integers(0, 6, size),
                             np.clip(rng.normal(14, 4, size), 6, 23).astype(int)),
            "merchant_category": rng.choice(CATEGORIES, size, p=fraud_w if fraud else legit_w),
            "channel": rng.choice(["online", "in_store", "atm"], size,
                                  p=[.6, .2, .2] if fraud else [.4, .5, .1]),
            "distance_from_home_km": rng.exponential(120 if fraud else 8, size).round(1),
            "international": (rng.random(size) < (0.3 if fraud else 0.02)).astype(int),
            "txn_count_24h": rng.poisson(5 if fraud else 1.5, size).astype(float),
            "avg_txn_amount": rng.lognormal(np.log(1500), 0.5, size).round(2),
        })

    df = pd.concat([block(nf, True).assign(is_fraud=1), block(nl, False).assign(is_fraud=0)])
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    # simulate missing values so the imputers have real work to do
    for col in ["distance_from_home_km", "txn_count_24h", "avg_txn_amount"]:
        df.loc[rng.random(len(df)) < 0.03, col] = np.nan
    return df


def build_pipeline(clf) -> Pipeline:
    prep = ColumnTransformer([
        ("num", Pipeline([("impute", SimpleImputer(strategy="median")),
                          ("scale", StandardScaler())]), NUMERIC),
        ("bin", SimpleImputer(strategy="most_frequent"), BINARY),
        ("cat", Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                          ("onehot", OneHotEncoder(handle_unknown="ignore"))]), CATEGORICAL),
    ])
    return Pipeline([("prep", prep), ("clf", clf)])


def train(csv=None, out_dir: Path = BASE) -> dict:
    df = pd.read_csv(csv) if csv else generate_synthetic()
    source = csv or "synthetic dataset"
    X, y = engineer(df[RAW]), df["is_fraud"].astype(int)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    candidates = {
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "Random Forest": RandomForestClassifier(n_estimators=250, min_samples_leaf=2, n_jobs=-1,
                                                class_weight="balanced_subsample", random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(random_state=42),
    }
    results, fitted = {}, {}
    for name, clf in candidates.items():
        pipe = build_pipeline(clf).fit(X_tr, y_tr)
        proba = pipe.predict_proba(X_te)[:, 1]
        pred = (proba >= 0.5).astype(int)
        results[name] = {
            "accuracy": round(float(accuracy_score(y_te, pred)), 4),
            "precision": round(float(precision_score(y_te, pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_te, pred)), 4),
            "f1": round(float(f1_score(y_te, pred)), 4),
            "roc_auc": round(float(roc_auc_score(y_te, proba)), 4),
            "confusion_matrix": confusion_matrix(y_te, pred).tolist(),
        }
        fitted[name] = pipe
        print(f"{name:20s} F1={results[name]['f1']:.3f}  AUC={results[name]['roc_auc']:.3f}")

    best = max(results, key=lambda k: results[k]["f1"])
    pipe = fitted[best]
    importances = []
    clf = pipe.named_steps["clf"]
    if hasattr(clf, "feature_importances_"):
        names = pipe.named_steps["prep"].get_feature_names_out()
        top = sorted(zip(names, clf.feature_importances_), key=lambda t: -t[1])[:8]
        importances = [{"feature": n.split("__", 1)[1], "importance": round(float(v), 4)} for n, v in top]

    joblib.dump(pipe, out_dir / "model.pkl")
    info = {
        "best_model": best, "trained_on": source, "samples": int(len(df)),
        "fraud_rate": round(float(y.mean()), 4), "models": results,
        "feature_importance": importances,
    }
    (out_dir / "metrics.json").write_text(json.dumps(info, indent=2))
    print(f"Saved best model: {best}")
    return info


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", help="optional CSV with RAW columns + is_fraud")
    train(ap.parse_args().csv)
