// frontend/src/lib/api.js
export const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export function authHeaders(idToken) {
  return {
    Authorization: `Bearer ${idToken}`,
    "Content-Type": "application/json",
  };
}

export async function uploadFile(idToken, file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: fd,
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  return res.json();
}

export async function createRun(idToken, payload) {
  const res = await fetch(`${API}/runs`, {
    method: "POST",
    headers: authHeaders(idToken),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createRun failed: ${res.status}`);
  return res.json();
}

export async function getRun(idToken, id) {
  const res = await fetch(`${API}/runs/${id}`, { headers: authHeaders(idToken) });
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

export async function getIntegrations(idToken) {
  const res = await fetch(`${API}/integrations`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(`getIntegrations failed: ${res.status}`);
  return res.json();
}

export async function disconnectGoogle(idToken) {
  const res = await fetch(`${API}/integrations/google/disconnect`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(`disconnect failed: ${res.status}`);
  return res.json();
}

// Start GitHub OAuth
export function githubStartUrl(idToken) {
  return `${API}/oauth/github/start?idToken=${encodeURIComponent(idToken)}`;
}

// Disconnect GitHub
export async function disconnectGitHub(idToken) {
  const res = await fetch(`${API}/oauth/github/disconnect`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(`github disconnect failed: ${res.status}`);
  return res.json();
}

// ------- History -------
export async function getHistory(idToken) {
  const res = await fetch(`${API}/history`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(`getHistory failed: ${res.status}`);
  return res.json(); // { runs: [...] }
}

export async function getHistoryRun(idToken, id) {
  const res = await fetch(`${API}/history/${id}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(`getHistoryRun failed: ${res.status}`);
  return res.json(); // full run { id, uid, instruction, steps:[], log:[]... }
}