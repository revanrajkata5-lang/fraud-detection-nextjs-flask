# Credit Card Fraud Detection — Next.js + Flask

Web implementation of the mini-project presentation (Methodist College of Engineering and Technology).

```
fraud-detection/
├── backend/    Flask API + ML training (scikit-learn) + SQLite
└── frontend/   Next.js 14 (App Router) UI: Home, Detect Fraud, Dashboard
```

## Run it

**1. Backend (terminal 1)**
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python train_model.py             # optional: app.py trains automatically if model.pkl is missing
python app.py                     # http://localhost:5000
```

**2. Frontend (terminal 2)**
```bash
cd frontend
npm install
npm run dev                       # http://localhost:3000
```
The frontend reads the API address from `frontend/.env.local` (`NEXT_PUBLIC_API_URL`, default `http://localhost:5000`).

## Pages
| Route | What it does |
|---|---|
| `/` | All 9 slides as a website: abstract, introduction, existing system, architecture, proposed solution, literature survey, conclusion |
| `/detect` | Transaction form -> Flask `/api/predict` -> Fraud/Legitimate + probability + risk indicators |
| `/dashboard` | Totals, fraud rate, charts, recent transactions, model comparison, feature importance |

## API
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/predict` | Validate, preprocess, predict and store a transaction |
| GET | `/api/stats` | Totals, per-category counts, 14-day timeline, risk distribution |
| GET | `/api/transactions?limit=25&label=Fraudulent` | Stored predictions |
| DELETE | `/api/transactions` | Clear history |
| GET | `/api/model-info` | Metrics of all trained models |
| GET | `/api/options` | Allowed categories and channels |
| GET | `/api/health` | Health check |

`POST /api/predict` body:
```json
{ "amount": 48500, "hour": 2, "merchant_category": "electronics", "channel": "online",
  "distance_from_home_km": 640, "international": true, "txn_count_24h": 7, "avg_txn_amount": 1800 }
```
Optional fields (`distance_from_home_km`, `txn_count_24h`, `avg_txn_amount`) may be omitted; they are imputed.

## Mapping to the architecture slide
1. **User layer** — browser UI (responsive)
2. **Web application layer** — Next.js frontend + Flask backend (`backend/app.py`)
3. **Model serving layer** — `/api/predict` loads `model.pkl`
4. **Database layer** — SQLite (`backend/fraud.db`) stores transactions, predictions, logs
5. **Output layer** — result card (Fraudulent / Legitimate) on `/detect`
6. **Training pipeline** — `backend/train_model.py`: data -> cleaning/imputation/encoding/scaling -> Logistic Regression, Random Forest, Gradient Boosting -> best model saved as `.pkl`

## Using real data
`train_model.py` generates a **synthetic** dataset by default so the project runs out of the box. Because it is synthetic, the reported scores are optimistic — don't quote them as real-world accuracy.
To train on your own data: `python train_model.py --csv your_data.csv` with columns
`amount, hour, merchant_category, channel, distance_from_home_km, international, txn_count_24h, avg_txn_amount, is_fraud`.
(The popular Kaggle credit-card dataset uses anonymised PCA columns V1–V28 instead, so it needs a small change to `features.py`.)

## Deployment notes
- Backend: `pip install gunicorn && gunicorn -b 0.0.0.0:5000 app:app`; set `CORS_ORIGINS` to your frontend URL.
- Frontend: set `NEXT_PUBLIC_API_URL` to the backend URL, then `npm run build && npm start`.
