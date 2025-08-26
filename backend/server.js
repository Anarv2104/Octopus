import "dotenv/config";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";

import { initBus } from "./lib/agentBus.js";
import { executeRun } from "./orchestrator/supervisor.js";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);

// firebase-admin init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// auth middleware
async function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/auth/me", requireAuth, (req, res) => {
  const { uid, email, name } = req.user;
  res.json({ uid, email, name: name || null });
});

// create run
app.post("/runs", requireAuth, (req, res) => {
  const { instruction, tools } = req.body || {};
  if (!instruction || !Array.isArray(tools) || tools.length === 0) {
    return res.status(400).json({ error: "instruction + tools required" });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const steps = tools.map((tool, idx) => ({
    id: `${tool}-${idx}`,
    tool,
    status: "pending",
    link: null,
    error: null,
  }));

  const runs = (app.locals.runs ||= {});
  runs[id] = {
    id,
    uid: req.user.uid,
    instruction,
    steps,
    log: [],        // bus messages
    memory: {},     // shared per-run memory
    status: "created",
    createdAt: Date.now(),
  };

  res.json({ id });
});

// get run
app.get("/runs/:id", requireAuth, (req, res) => {
  const run = (app.locals.runs || {})[req.params.id];
  if (!run || run.uid !== req.user.uid) return res.status(404).json({ error: "not found" });
  res.json(run);
});

// execute run (async)
app.post("/runs/:id/execute", requireAuth, async (req, res) => {
  const run = (app.locals.runs || {})[req.params.id];
  if (!run || run.uid !== req.user.uid) return res.status(404).json({ error: "not found" });

  setImmediate(() => {
    executeRun(app, req.params.id).catch((e) => console.error("executeRun error:", e));
  });

  res.json({ ok: true });
});

const port = process.env.PORT || 3001;
initBus(app);
app.listen(port, () => console.log(`API on :${port}`));