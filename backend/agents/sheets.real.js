// backend/agents/sheets.real.js
import { google } from "googleapis";
import { getIntegration, setIntegration } from "../lib/db.js";
import { asGoogleClient } from "../lib/googleAuth.js";

/** Normalize "range" to "Title!A1" form */
function normalizeRange(range) {
  if (!range || typeof range !== "string" || !range.trim()) return "Sheet1!A1";
  const r = range.trim();
  return r.includes("!") ? r : `${r}!A1`;
}

/** Extract desired spreadsheet title from the instruction.
 * Supports:
 *  - sheet: Sprint 3 QA   (explicit directive wins)
 *  - "create a new sheet called/ named \"Sprint 3 QA\""
 *  - "create a new sheet Sprint 3 QA"
 *  - "write/append/log ... to/into/in sheet Sprint 3 QA"
 *  - "in Sprint 3 QA sheet"
 */
function extractDesiredSheetName(instruction = "") {
  const s = String(instruction || "").trim();
  if (!s) return null;

  // Explicit directive: sheet: <name>
  const mExplicit = s.match(/\bsheet\s*:\s*([^\n]+)/i);
  if (mExplicit?.[1]) return mExplicit[1].replace(/^["“']|["”']$/g, "").trim();

  // Quoted names after the word sheet/spreadsheet
  const mQuoted = s.match(/(?:sheet|spreadsheet)[^"“”']*["“”']([^"“”']+)["“”']/i);
  if (mQuoted?.[1]) return mQuoted[1].trim();

  // "called|named <Name>"
  const mCalled = s.match(/(?:new\s+)?(?:sheet|spreadsheet)\s+(?:called|named)\s+([A-Za-z0-9 _.-]{2,100})/i);
  if (mCalled?.[1]) return mCalled[1].trim();

  // "create a new sheet <Name>"
  const mNew = s.match(/create\s+(?:a\s+)?new\s+(?:sheet|spreadsheet)\s+([A-Za-z0-9 _.-]{2,100})/i);
  if (mNew?.[1]) return mNew[1].trim();

  // "(write|append|log) ... (to|into|in) (sheet|spreadsheet) <Name>"
  const mTo = s.match(/(?:write|append|log).{0,40}?(?:to|into|in)\s+(?:the\s+)?(?:sheet|spreadsheet)\s+([A-Za-z0-9 _.-]{2,100})/i);
  if (mTo?.[1]) return mTo[1].trim();

  // "in <Name> sheet"
  const mIn = s.match(/in\s+([A-Za-z0-9 _.-]{2,100})\s+(?:sheet|spreadsheet)/i);
  if (mIn?.[1]) return mIn[1].trim();

  return null;
}

/** Resolve the gid (sheetId) for a given sheet tab title */
async function getSheetGid(sheetsApi, spreadsheetId, sheetTitle) {
  const meta = await sheetsApi.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });
  const sh = meta?.data?.sheets?.find((s) => s?.properties?.title === sheetTitle);
  return sh?.properties?.sheetId ?? 0; // fallback to first tab
}

export async function sheetsRealAgent(ctx) {
  const { uid, instruction, memory } = ctx;

  const timestamp = new Date().toISOString();
  const summary   = memory?.lastSummary || instruction || "(no summary)";
  const fileUrl   = memory?.fileUrl || "";
  const runId     = memory?.runId || ""; // optional, if you patch it in supervisor

  // OAuth client
  const auth   = await asGoogleClient(uid);
  const sheets = google.sheets({ version: "v4", auth });

  // User default config (saved after first creation)
  const cfg = await getIntegration(uid, "sheets");
  let spreadsheetId = cfg?.spreadsheetId || null;
  let range = normalizeRange(cfg?.defaultRange || "Sheet1!A1");
  const sheetTitle = range.split("!")[0];

  // If instruction asks for a custom/new spreadsheet, create it just for this run
  const desiredTitle = extractDesiredSheetName(instruction);
  if (desiredTitle) {
    const created = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: desiredTitle },
        sheets: [{ properties: { title: sheetTitle } }],
      },
    });
    spreadsheetId = created?.data?.spreadsheetId;
    if (!spreadsheetId) throw new Error("Failed to create requested Google Sheet");

    // Header row for brand-new sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [["Timestamp", "Instruction", "Summary", "File URL", "Run ID"]] },
    });
  }

  // If still no spreadsheet, create/persist default “Octopus Outputs”
  if (!spreadsheetId) {
    const created = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: "Octopus Outputs" },
        sheets: [{ properties: { title: sheetTitle } }],
      },
    });
    spreadsheetId = created?.data?.spreadsheetId;
    if (!spreadsheetId) throw new Error("Failed to create default Google Sheet");

    await setIntegration(uid, "sheets", {
      ...(cfg || {}),
      spreadsheetId,
      defaultRange: range,
    });

    // Header row on first creation of the default sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [["Timestamp", "Instruction", "Summary", "File URL", "Run ID"]] },
    });
  }

  // Append row and capture exact row index from updatedRange
  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[timestamp, instruction || "", summary, fileUrl, runId]] },
    // includeValuesInResponse can remain false; updatedRange is in 'updates'
  });

  const updatedRange = appendRes?.data?.updates?.updatedRange || ""; // e.g., "Sheet1!A3:E3"
  const m = updatedRange.match(/![A-Z]+(\d+):/i);
  const rowNum = m ? Number(m[1]) : null;

  // Resolve gid for the tab we wrote to and build deep link to that row
  const gid = await getSheetGid(sheets, spreadsheetId, sheetTitle);
  const rangeAnchor = rowNum ? `A${rowNum}:E${rowNum}` : null;

  const url = rangeAnchor
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}&range=${encodeURIComponent(rangeAnchor)}`
    : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}`;

  return {
    link: url,
    payload: {
      ok: true,
      spreadsheetId,
      range,
      usedTitle: desiredTitle || "default",
      updatedRange: updatedRange || null,
      rowNum: rowNum || null,
      gid,
    },
    memoryPatch: { lastSheetUrl: url },
  };
}