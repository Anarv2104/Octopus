import "dotenv/config";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";

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
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // safety
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
    req.user = decoded; // uid, email, etc
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/auth/me", requireAuth, (req, res) => {
  const { uid, email, name } = req.user;
  res.json({ uid, email, name: name || null });
});

// POST /runs -> create a new run (id + steps)
app.post("/runs", requireAuth, async (req, res) => {
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
  req.app.locals.runs ||= {};
  req.app.locals.runs[id] = {
    id,
    uid: req.user.uid,
    instruction,
    steps,
    createdAt: Date.now(),
  };
  res.json({ id });
});

// GET /runs/:id -> current status
app.get("/runs/:id", requireAuth, (req, res) => {
  const run = (req.app.locals.runs || {})[req.params.id];
  if (!run || run.uid !== req.user.uid) return res.status(404).json({ error: "not found" });
  res.json(run);
});

// POST /runs/:id/execute -> simulate sequential success
app.post("/runs/:id/execute", requireAuth, async (req, res) => {
  const store = req.app.locals.runs || {};
  const run = store[req.params.id];
  if (!run || run.uid !== req.user.uid) return res.status(404).json({ error: "not found" });

  const LINKS = {
    notion: "https://www.notion.so/your-demo-page",
    sheets: "https://docs.google.com/spreadsheets/d/DEMO",
    github: "https://github.com/your/repo/issues",
    slack: "https://app.slack.com/client/T000/C000/p000",
    email: "mailto:someone@example.com",
    summarizer: "https://octopus.example/summaries/demo",
  };

  for (const step of run.steps) {
    await new Promise((r) => setTimeout(r, 700));
    step.status = "done";
    step.link = LINKS[step.tool] || "#";
    step.error = null;
  }
  res.json({ ok: true });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API on :${port}`));