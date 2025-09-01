// backend/lib/history.js
import admin from "firebase-admin";

// Collection layout (flat top-level by run id):
// runs/{runId} { id, uid, instruction, createdAt, status, fileUrl, steps:[{id,tool,status}] }
// runs/{runId}/steps/{stepId} { id, tool, status, link, error, payload, createdAt, updatedAt }
// runs/{runId}/log/{autoId}   { ts, from, type, payload }

function colRuns() {
  return admin.firestore().collection("runs");
}

export async function saveRunMeta(run) {
  try {
    const ref = colRuns().doc(run.id);
    const data = {
      id: run.id,
      uid: run.uid,
      instruction: run.instruction,
      createdAt: run.createdAt || Date.now(),
      completedAt: run.completedAt || null,
      status: run.status,
      fileUrl: run.fileUrl || null,
      // lightweight steps snapshot for list view
      steps: (run.steps || []).map((s) => ({ id: s.id, tool: s.tool, status: s.status })),
    };
    await ref.set(data, { merge: true });
  } catch (e) {
    console.warn("[history] saveRunMeta skipped:", e.message);
  }
}

export async function saveStep(runId, step) {
  try {
    const ref = colRuns().doc(runId).collection("steps").doc(step.id);
    const data = {
      id: step.id,
      tool: step.tool,
      status: step.status,
      link: step.link || null,
      error: step.error || null,
      payload: step.payload || null,
      updatedAt: Date.now(),
      createdAt: step.createdAt || Date.now(),
    };
    await ref.set(data, { merge: true });
  } catch (e) {
    console.warn("[history] saveStep skipped:", e.message);
  }
}

export async function appendLog(runId, entry) {
  try {
    const ref = colRuns().doc(runId).collection("log");
    const data = {
      ts: Date.now(),
      ...entry, // { from, type, payload }
    };
    await ref.add(data);
  } catch (e) {
    console.warn("[history] appendLog skipped:", e.message);
  }
}

export async function finalizeRun(run) {
  try {
    const ref = colRuns().doc(run.id);
    await ref.set(
      { status: run.status, completedAt: run.completedAt || Date.now() },
      { merge: true }
    );
  } catch (e) {
    console.warn("[history] finalizeRun skipped:", e.message);
  }
}

/* ---------- read helpers for API ---------- */
export async function listRunsForUser(uid, { limit = 50 } = {}) {
  // Fetch with a single-field filter (no orderBy) to avoid composite index requirement.
  const snap = await colRuns()
    .where("uid", "==", uid)
    .limit(limit)
    .get();

  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Sort newest first in memory
  rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return rows;
}

export async function getRunFull(runId) {
  const runRef = colRuns().doc(runId);
  const runDoc = await runRef.get();
  if (!runDoc.exists) return null;

  const stepsSnap = await runRef.collection("steps").orderBy("createdAt").get();
  const logSnap = await runRef.collection("log").orderBy("ts").get();

  return {
    id: runDoc.id,
    ...runDoc.data(),
    steps: stepsSnap.docs.map((d) => d.data()),
    log: logSnap.docs.map((d) => d.data()),
  };
}