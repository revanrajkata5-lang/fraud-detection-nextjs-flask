"use client";
import { useEffect, useState } from "react";
import { getOptions, predict } from "@/lib/api";

const FALLBACK_CATEGORIES = ["grocery", "fuel", "restaurant", "utilities", "entertainment",
  "electronics", "online_shopping", "travel", "jewelry", "atm_withdrawal"];
const FALLBACK_CHANNELS = ["online", "in_store", "atm"];

const EMPTY = {
  amount: "", hour: "", merchant_category: "grocery", channel: "in_store",
  distance_from_home_km: "", international: false, txn_count_24h: "", avg_txn_amount: "",
};
const SAMPLES = {
  legit: { amount: 1250, hour: 14, merchant_category: "grocery", channel: "in_store",
    distance_from_home_km: 4, international: false, txn_count_24h: 1, avg_txn_amount: 1500 },
  suspicious: { amount: 48500, hour: 2, merchant_category: "electronics", channel: "online",
    distance_from_home_km: 640, international: true, txn_count_24h: 7, avg_txn_amount: 1800 },
};
const pretty = (s) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function Field({ k, label, type = "number", hint, form, set, fieldErrors, ...rest }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={form[k]} onChange={set(k)} step="any" {...rest} />
      {hint && <small className="muted">{hint}</small>}
      {fieldErrors[k] && <small className="err">{fieldErrors[k]}</small>}
    </label>
  );
}

export default function DetectPage() {
  const [form, setForm] = useState(EMPTY);
  const [opts, setOpts] = useState({ categories: FALLBACK_CATEGORIES, channels: FALLBACK_CHANNELS });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { getOptions().then(setOpts).catch(() => {}); }, []);

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(""); setFieldErrors({}); setResult(null);
    try {
      setResult(await predict(form));
    } catch (err) {
      setError(err.message); setFieldErrors(err.fields || {});
    } finally {
      setLoading(false);
    }
  }

  const pct = result ? Math.round(result.probability * 1000) / 10 : 0;

  return (
    <div className="container page">
      <p className="eyebrow">Live demo</p>
      <h1 className="h1-sm">Analyze a transaction</h1>
      <p className="lead">Enter the transaction details. The Flask API preprocesses them and the trained model returns a fraud probability.</p>

      <div className="detect-grid">
        <form className="card" onSubmit={onSubmit}>
          <div className="row-between">
            <h3>Transaction details</h3>
            <div className="samples">
              <button type="button" className="chip" onClick={() => setForm(SAMPLES.legit)}>Sample: normal</button>
              <button type="button" className="chip" onClick={() => setForm(SAMPLES.suspicious)}>Sample: suspicious</button>
            </div>
          </div>

          <div className="form-grid">
            <Field form={form} set={set} fieldErrors={fieldErrors} k="amount" label="Amount (₹) *" min="0" required placeholder="e.g. 2500" />
            <Field form={form} set={set} fieldErrors={fieldErrors} k="hour" label="Hour of day (0–23) *" min="0" max="23" required placeholder="e.g. 14" />
            <label className="field">
              <span>Merchant category *</span>
              <select value={form.merchant_category} onChange={set("merchant_category")}>
                {opts.categories.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Channel *</span>
              <select value={form.channel} onChange={set("channel")}>
                {opts.channels.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
              </select>
            </label>
            <Field form={form} set={set} fieldErrors={fieldErrors} k="distance_from_home_km" label="Distance from home (km)" min="0" hint="Optional" />
            <Field form={form} set={set} fieldErrors={fieldErrors} k="txn_count_24h" label="Transactions in last 24h" min="0" hint="Optional" />
            <Field form={form} set={set} fieldErrors={fieldErrors} k="avg_txn_amount" label="Customer's average amount (₹)" min="0" hint="Optional" />
            <label className="field check">
              <input type="checkbox" checked={form.international} onChange={set("international")} />
              <span>International transaction</span>
            </label>
          </div>

          {error && <div className="alert">{error}</div>}
          <button className="btn primary full" disabled={loading}>
            {loading ? "Analyzing…" : "Check transaction"}
          </button>
        </form>

        <aside className="card result-card">
          {!result ? (
            <div className="placeholder">
              <div className="shield">🛡️</div>
              <p className="muted">Results will appear here. Missing optional fields are handled automatically by the preprocessing pipeline.</p>
            </div>
          ) : (
            <div className={`result ${result.label === "Fraudulent" ? "bad" : "good"}`}>
              <div className="badge">{result.label === "Fraudulent" ? "⚠ Transaction flagged" : "✔ Transaction approved"}</div>
              <h2>{result.label}</h2>
              <div className="meter"><div style={{ width: `${pct}%` }} /></div>
              <p className="prob"><strong>{pct}%</strong> fraud probability · <span className={`risk ${result.risk_level}`}>{result.risk_level} risk</span></p>
              <h4>Risk indicators</h4>
              <ul className="list">{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              <p className="muted small">Saved as transaction #{result.id}. See it on the dashboard.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
