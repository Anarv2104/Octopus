// backend/oauth/google.js
import express from "express";
import { google } from "googleapis";
import admin from "firebase-admin";
import { getIntegration, setIntegration } from "../lib/db.js";

export const router = express.Router();

function buildOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // http://localhost:3001/oauth/google/callback
  );
}

// Step 1 — send user to Google with a verified Firebase uid
router.get("/start", async (req, res) => {
  try {
    const idToken = req.query.idToken || "";
    if (!idToken) return res.status(400).send("Missing idToken");
    const { uid } = await admin.auth().verifyIdToken(idToken);

    const oauth = buildOAuthClient();
    const scopes = [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/drive.file",
      "openid", "email", "profile",
    ];

    const url = oauth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state: uid, // simple uid => avoids JSON/base64 pitfalls
    });

    res.redirect(url);
  } catch (e) {
    res.status(500).send(`OAuth start error: ${e.message}`);
  }
});

// Step 2 — Google callback: exchange code, fetch profile email, save
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send("Missing code/state");
    const uid = state;

    const oauth = buildOAuthClient();
    const { tokens } = await oauth.getToken(code);
    oauth.setCredentials(tokens);

    // Get profile email for display
    let email = null;
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauth });
      const me = await oauth2.userinfo.get();
      email = me?.data?.email || null;
    } catch {
      // non-blocking
    }

    await setIntegration(uid, "google", {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + (tokens.expires_in || 0) * 1000,
      scope: tokens.scope,
      email,
    });

    // ensure sheet cfg exists for the Sheets agent
    const sheetsCfg = await getIntegration(uid, "sheets");
    if (!sheetsCfg) await setIntegration(uid, "sheets", { defaultRange: "Sheet1!A1" });

    const dest = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    res.send(`
      <html>
        <body style="font-family:system-ui;">
          <h3>Google connected ✔</h3>
          <p>You can close this window and return to Octopus.</p>
          <script>setTimeout(() => window.location = "${dest}/dashboard", 700);</script>
        </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(`OAuth callback error: ${e.message}`);
  }
});