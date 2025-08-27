// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import multer from "multer";
import { google } from "googleapis";

import { initBus } from "./lib/agentBus.js";
import { executeRun } from "./orchestrator/supervisor.js";
import { router as googleOAuthRouter } from "./oauth/google.js";
import { getIntegration, deleteIntegration } from "./lib/db.js";

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));

/* ---------- Uploads ---------- */
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const base = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}`);
  },
});
const upload = multer({ storage });

const PUBLIC_BASE =
  process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;

/* ---------- Firebase Admin ---------- */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

/* ---------- OAuth routes ---------- */
app.use("/oauth/google", googleOAuthRouter);

/* ---------- Auth middleware ---------- */
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

/* ---------- Integrations status ---------- */
app.get("/integrations", requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const g = await getIntegration(uid, "google");
    res.json({
      google: {
        connected: !!(g && (g.access_token || g.refresh_token)),
        email: g?.email || null,
        updatedAt: g?.updatedAt || null,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ---------- Disconnect Google (revokes + clears) ---------- */
app.post("/integrations/google/disconnect", requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const g = await getIntegration(uid, "google");
    if (g?.access_token || g?.refresh_token) {
      const oauth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      const token = g.refresh_token || g.access_token;
      if (token) {
        try { await oauth.revokeToken(token); } catch { /* ignore network errors */ }
      }
    }
    await deleteIntegration(uid, "google");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ---------- Upload API ---------- */
app.post("/upload", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileId = req.file.filename;
  const url = `${PUBLIC_BASE}/uploads/${fileId}`;
  res.json({
    fileId, url,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

/* ---------- Runs API (in-memory) ---------- */
app.post("/runs", requireAuth, (req, res) => {
  const { instruction, tools, fileId } = req.body || {};
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
    payload: null,
  }));

  const runs = (app.locals.runs ||= {});
  const fileUrl = fileId ? `${PUBLIC_BASE}/uploads/${fileId}` : null;

  runs[id] = {
    id,
    uid: req.user.uid,
    instruction,
    steps,
    log: [],
    memory: { ...(fileUrl ? { fileUrl } : {}) },
    status: "created",
    fileId: fileId || null,
    fileUrl,
    createdAt: Date.now(),
  };

  res.json({ id });
});

app.get("/runs/:id", requireAuth, (req, res) => {
  const run = (app.locals.runs || {})[req.params.id];
  if (!run || run.uid !== req.user.uid) return res.status(404).json({ error: "not found" });
  res.json(run);
});

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