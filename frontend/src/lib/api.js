// frontend/src/lib/api.js

// Normalize base URL (removes trailing / if present)
export const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export function authHeaders(idToken) {
  return {
    Authorization: `Bearer ${idToken}`,
    "Content-Type": "application/json",
  };
}

export async function createRun(idToken, payload) {
  const res = await fetch(`${API}/runs`, {
    method: "POST",
    headers: authHeaders(idToken),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createRun failed: ${res.status}`);
  return res.json(); // { id }
}

export async function getRun(idToken, id) {
  const res = await fetch(`${API}/runs/${id}`, {
    headers: authHeaders(idToken),
  });
  if (!res.ok) throw new Error(`getRun failed: ${res.status}`);
  return res.json();
}

export async function executeRun(idToken, id) {
  const res = await fetch(`${API}/runs/${id}/execute`, {
    method: "POST",
    headers: authHeaders(idToken),
  });
  if (!res.ok) throw new Error(`executeRun failed: ${res.status}`);
  return res.json();
}