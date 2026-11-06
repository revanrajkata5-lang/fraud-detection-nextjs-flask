"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { clearTransactions, getModelInfo, getStats, getTransactions } from "@/lib/api";

const GREEN = "#16a34a", RED = "#dc2626", BLUE = "#2563eb";
const pretty = (s) => s.replace(/_/g, " ");

function Stat({ label, value, tone }) {
  return (
    <div className={`card stat ${tone || ""}`}>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [txns, setTxns] = useState([]);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, t, m] = await Promise.all([getStats(), getTransactions(15), getModelInfo()]);
      setStats(s); setTxns(t); setInfo(m); setError("");
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(load, 10000); // auto-refresh every 10s
    return () => clearInterval(id);
  }, [load]);

  async function reset() {
    if (confirm("Delete all stored transactions?")) { await clearTransactions(); load(); }
  }

  if (error) return <div className="container page"><div className="alert">{error}</div></div>;
  if (!stats) return <div className="container page"><p className="muted">Loading…</p></div>;

  const pie = [
    { name: "Legitimate", value: stats.legitimate, color: GREEN },
    { name: "Fraudulent", value: stats.fraudulent, color: RED },
  ];
  const empty = stats.total === 0;

  return (
    <div className="container page">
      <div className="row-between">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1 className="h1-sm">Fraud dashboard</h1>
        </div>
        <div className="samples">
          <button className="chip" onClick={load}>↻ Refresh</button>
          <button className="chip" onClick={reset}>Clear data</button>
        </div>
      </div>

      <div className="grid-4">
        <Stat label="Transactions analyzed" value={stats.total} />
        <Stat label="Legitimate" value={stats.legitimate} tone="good" />
        <Stat label="Potentially fraudulent" value={stats.fraudulent} tone="bad" />
        <Stat label="Fraud rate" value={`${(stats.fraud_rate * 100).toFixed(1)}%`} />
      </div>

      {empty ? (
        <div className="card empty">No transactions yet. Analyze one on the <Link href="/detect">Detect Fraud</Link> page and the charts will fill up.</div>
      ) : (
        <div className="charts">
          <div className="card">
            <h3>Legitimate vs fraudulent</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {pie.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3>By merchant category</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={(stats.by_category || []).map((c) => ({ ...c, category: pretty(c.category) }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} /><Tooltip /><Legend />
                <Bar dataKey="legitimate" stackId="a" fill={GREEN} />
                <Bar dataKey="fraudulent" stackId="a" fill={RED} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card wide">
            <h3>Last 14 days</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="legitimate" stroke={GREEN} strokeWidth={2} />
                <Line type="monotone" dataKey="fraudulent" stroke={RED} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Recent transactions</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Time</th><th>Amount</th><th>Category</th><th>Channel</th><th>Probability</th><th>Result</th></tr></thead>
            <tbody>
              {txns.length === 0 && <tr><td colSpan={7} className="muted">Nothing here yet.</td></tr>}
              {txns.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.created_at.replace("T", " ")}</td>
                  <td>₹{Number(t.amount ?? 0).toLocaleString("en-IN")}</td>
                  <td>{pretty(t.merchant_category)}</td>
                  <td>{pretty(t.channel)}</td>
                  <td>{(Number(t.probability ?? 0) * 100).toFixed(1)}%</td>
                  <td><span className={`tag ${t.label === "Fraudulent" ? "bad" : "good"}`}>{t.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {info?.models && (
        <div className="grid-2">
          <div className="card">
            <h3>Model comparison <span className="muted small">(best: {info.best_model})</span></h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
                <tbody>
                  {Object.entries(info.models).map(([name, m]) => (
                    <tr key={name} className={name === info.best_model ? "hl" : ""}>
                      <td>{name}</td><td>{m.accuracy}</td><td>{m.precision}</td><td>{m.recall}</td><td>{m.f1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small">Trained on: {info.trained_on} ({Number(info.samples ?? 0).toLocaleString()} rows).</p>
          </div>
          <div className="card">
            <h3>Top features</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={info.feature_importance} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" hide /><YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={140} />
                <Tooltip /><Bar dataKey="importance" fill={BLUE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
