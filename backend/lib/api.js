const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function uploadFile(idToken, file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json(); // { id, name, url, hasText }
}

// existing:
export async function createRun(idToken, payload) { /* unchanged */ }
export async function executeRun(idToken, id) { /* unchanged */ }
export async function getRun(idToken, id) { /* unchanged */ }