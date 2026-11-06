export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...options });
  } catch {
    throw new Error("Cannot reach the Flask backend. Make sure it is running on " + API_URL);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.fields = data.fields || {};
    throw err;
  }
  return data;
}

export const predict = (payload) =>
  request("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
export const getStats = () => request("/api/stats");
export const getTransactions = (limit = 15) => request(`/api/transactions?limit=${limit}`);
export const getModelInfo = () => request("/api/model-info");
export const getOptions = () => request("/api/options");
export const clearTransactions = () => request("/api/transactions", { method: "DELETE" });
