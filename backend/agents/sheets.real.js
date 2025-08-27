// backend/agents/sheets.real.js
import { google } from "googleapis";
import { getIntegration, setIntegration } from "../lib/db.js";

function buildOAuthClient() {
  const oAuth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // e.g. http://localhost:3001/oauth/google/callback
  );
  return oAuth;
}

async function asGoogleClient(uid) {
  const oauth = buildOAuthClient();
  const g = await getIntegration(uid, "google");
  if (!g?.access_token) throw new Error("Google account not connected");

  oauth.setCredentials({
    access_token: g.access_token,
    refresh_token: g.refresh_token,
    expiry_date: g.expiry_date || 0,
  });

  // auto-refresh handling
  oauth.on("tokens", async (tokens) => {
    if (tokens.refresh_token || tokens.access_token) {
      await setIntegration(uid, "google", {
        access_token: tokens.access_token ?? g.access_token,
        refresh_token: tokens.refresh_token ?? g.refresh_token,
        expiry_date: Date.now() + (tokens.expires_in || 0) * 1000,
      });
    }
  });

  return oauth;
}

export async function sheetsRealAgent(ctx) {
  const { uid, instruction, memory } = ctx;
  const summary = memory?.lastSummary || instruction || "(no summary)";
  const timestamp = new Date().toISOString();

  const auth = await asGoogleClient(uid);
  const sheets = google.sheets({ version: "v4", auth });

  // read defaults (spreadsheetId, range) from integrations/sheets
  const cfg = await getIntegration(uid, "sheets");
  const spreadsheetId = cfg?.spreadsheetId;
  let range = cfg?.defaultRange || "Sheet1!A1";

  if (!spreadsheetId) {
    // Optional: create a new spreadsheet if none exists
    const createResp = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: "Octopus Outputs" },
        sheets: [{ properties: { title: "Sheet1" } }],
      },
    });
    const id = createResp.data.spreadsheetId;
    await setIntegration(uid, "sheets", { spreadsheetId: id, defaultRange: "Sheet1!A1" });
    range = "Sheet1!A1";
  }

  const targetSpreadsheetId = spreadsheetId || (await getIntegration(uid, "sheets")).spreadsheetId;

  // Append a row
  await sheets.spreadsheets.values.append({
    spreadsheetId: targetSpreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[timestamp, summary]] },
  });

  const url = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`;
  return {
    link: url,
    payload: { ok: true, spreadsheetId: targetSpreadsheetId, range },
    memoryPatch: { lastSheetUrl: url },
  };
}