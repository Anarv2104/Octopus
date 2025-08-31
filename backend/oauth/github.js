// backend/oauth/github.js
import express from "express";
import admin from "firebase-admin";
import fetch from "node-fetch";
import { getIntegration, setIntegration, deleteIntegration } from "../lib/db.js";

export const router = express.Router();

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API = "https://api.github.com";

function requireEnv() {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } = process.env;
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_REDIRECT_URI) {
    throw new Error("Missing GitHub OAuth env (GITHUB_CLIENT_ID/SECRET/REDIRECT_URI)");
  }
  return { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI };
}

// Step 1: redirect to GitHub
router.get("/start", async (req, res) => {
  try {
    const { GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI } = requireEnv();
    const idToken = req.query.idToken || "";
    if (!idToken) return res.status(400).send("Missing idToken");
    const { uid } = await admin.auth().verifyIdToken(idToken);

    const scopes = ["repo", "read:user"].join(" ");
    const url =
      `${GITHUB_OAUTH_URL}?client_id=${encodeURIComponent(GITHUB_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${encodeURIComponent(uid)}`;

    res.redirect(url);
  } catch (e) {
    res.status(500).send(`GitHub start error: ${e.message}`);
  }
});

// Step 2: callback → exchange code → store token + login
router.get("/callback", async (req, res) => {
  try {
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = requireEnv();
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send("Missing code/state");
    const uid = String(state);

    // exchange code
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      throw new Error(`Token exchange failed: ${tokenRes.status} ${JSON.stringify(tokenJson)}`);
    }
    const access_token = tokenJson.access_token;

    // get user login
    const meRes = await fetch(`${GITHUB_API}/user`, {
      headers: { Authorization: `Bearer ${access_token}`, Accept: "application/vnd.github+json" },
    });
    const me = await meRes.json();
    const login = me?.login || null;

    await setIntegration(uid, "github", { access_token, login });

    const dest = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    res.send(`
      <html><body style="font-family:system-ui">
      <h3>GitHub connected ✔</h3>
      <p>User: ${login || "unknown"}</p>
      <script>setTimeout(() => window.location = "${dest}/dashboard", 600);</script>
      </body></html>
    `);
  } catch (e) {
    res.status(500).send(`GitHub callback error: ${e.message}`);
  }
});

// Disconnect: delete stored token
router.post("/disconnect", async (req, res) => {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    const { uid } = await admin.auth().verifyIdToken(token);

    const gh = await getIntegration(uid, "github"); // not strictly needed, but leaves room for future revoke
    if (gh?.access_token) {
      // Optionally call GitHub’s revocation API — not required for demos
    }
    await deleteIntegration(uid, "github");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});