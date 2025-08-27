// backend/agents/sheets.real.js
import { google } from "googleapis";
import { getIntegration, setIntegration } from "../lib/db.js";
import { asGoogleClient } from "../lib/googleAuth.js";

function normalizeRange(range) {
  // Accept "Sheet1", "Sheet1!A1", or full ranges; default to "Sheet1!A1"
  if (!range || typeof range !== "string" || !range.trim()) return "Sheet1!A1";
  const r = range.trim();
  return r.includes("!") ? r : `${r}!A1`;
}

export async function sheetsRealAgent(ctx) {
  const { uid, instruction, memory } = ctx;

  // Prefer summarizer output, fallback to instruction
  const summary = memory?.lastSummary || instruction || "(no summary)";
  const timestamp = new Date().toISOString();

  // OAuth client with shared refresh/persist logic
  const auth = await asGoogleClient(uid);
  const sheets = google.sheets({ version: "v4", auth });

  // Read user sheet config
  const cfg = await getIntegration(uid, "sheets");
  let spreadsheetId = cfg?.spreadsheetId || null;
  let range = normalizeRange(cfg?.defaultRange || "Sheet1!A1");

  // If no spreadsheet configured, create a lightweight one and save to integrations
  if (!spreadsheetId) {
    const createResp = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: "Octopus Outputs" },
        sheets: [{ properties: { title: range.split("!")[0] || "Sheet1" } }],
      },
    });

    spreadsheetId = createResp?.data?.spreadsheetId;
    if (!spreadsheetId) throw new Error("Failed to create Google Sheet");

    // Persist spreadsheetId + keep any existing defaults
    await setIntegration(uid, "sheets", {
      spreadsheetId,
      defaultRange: range,
      ...(cfg || {}),
    });
  }

  // Append a row: [timestamp, summary]
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[timestamp, summary]] },
  });

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  return {
    link: url,
    payload: { ok: true, spreadsheetId, range },
    memoryPatch: { lastSheetUrl: url },
  };
}