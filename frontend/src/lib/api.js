// frontend/src/lib/api.js

// Normalize base URL (remove trailing slashes)
export const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

/** Auth header helper */
export function authHeaders(idToken) {
  return {
    Authorization: `Bearer ${idToken}`,
    "Content-Type": "application/json",
  };
}

/** Upload a file (FormData — do NOT set Content-Type manually) */
export async function uploadFile(idToken, file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: fd,
  });

  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  return res.json(); // { fileId, url, originalName, mimetype, size }
}

/** Create a run */
export async function createRun(idToken, payload) {
  const res = await fetch(`${API}/runs`, {
    method: "POST",
    headers: authHeaders(idToken),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createRun failed: ${res.status}`);
  return res.json(); // { id }
}

/** Get a run by id */
export async function getRun(idToken, id) {
  const res = await fetch(`${API}/runs/${id}`, { headers: authHeaders(idToken) });
  if (!res.ok) throw new Error(`getRun failed: ${res.status}`);
  return res.json();
}

/** Execute a run */
export async function executeRun(idToken, id) {
  const res = await fetch(`${API}/runs/${id}/execute`, {
    method: "POST",
    headers: authHeaders(idToken),
  });
  if (!res.ok) throw new Error(`executeRun failed: ${res.status}`);
  return res.json();
}

/** Integrations status  -> { google: { connected: boolean, email?: string, updatedAt?: number } } */
export async function getIntegrations(idToken) {
  const res = await fetch(`${API}/integrations`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(`getIntegrations failed: ${res.status}`);
  return res.json();
}

/** Disconnect Google (matches backend POST /integrations/google/disconnect) */
export async function disconnectGoogle(idToken) {
  const res = await fetch(`${API}/integrations/google/disconnect`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(`disconnect failed: ${res.status}`);
  return res.json();
}

