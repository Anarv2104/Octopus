// backend/agents/email.real.js
import { google } from "googleapis";
import { getIntegration } from "../lib/db.js";
import { asGoogleClient } from "../lib/googleAuth.js";

function base64Url(str) {
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Try to pull a recipient email out of the natural instruction text */
function extractRecipientFromInstruction(instruction = "") {
  const text = instruction || "";
  // common phrasing: "email it to xxx@yyy.com", "send to xxx@yyy.com"
  const re = /(?:email|mail|send)\s+(?:it|this|summary|report)?\s*(?:to|at)\s*([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i;
  const m = text.match(re);
  if (m?.[1]) return m[1];
  // fallback: any email anywhere in the sentence
  const any = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return any?.[0] || null;
}

export async function emailRealAgent(ctx) {
  const { uid, instruction, memory } = ctx;

  // OAuth client with: load tokens, auto-refresh, persist refreshed tokens
  const auth = await asGoogleClient(uid);
  const gmail = google.gmail({ version: "v1", auth });

  // 1) recipient priority: parsed from instruction -> saved integration -> DEV_FALLBACK_EMAIL
  const parsedTo = extractRecipientFromInstruction(instruction);
  const savedCfg = await getIntegration(uid, "email"); // may contain { to: "…" }
  const to =
    parsedTo ||
    savedCfg?.to ||
    process.env.DEV_FALLBACK_EMAIL;

  if (!to) {
    return { link: "#", payload: { ok: false, note: "No recipient (set integrations/email.to or DEV_FALLBACK_EMAIL)" } };
  }

  // 2) subject/body: prefer summary captured by summarizer
  const summary = memory?.lastSummary || ctx?.payload?.summary || null;
  const subject = (instruction || "Octopus Update").slice(0, 180);
  const body = summary || instruction || "(no content)";

  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\r\n");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: base64Url(raw) },
  });

  const id = res?.data?.id;
  const threadId = res?.data?.threadId;
  const link =
    (id && `https://mail.google.com/mail/u/0/#all/${id}`) ||
    (threadId && `https://mail.google.com/mail/u/0/#inbox/${threadId}`) ||
    "#";

  return {
    link,
    payload: { ok: true, id, threadId, to, usedSummary: !!summary },
    memoryPatch: { lastEmailId: id, lastEmailTo: to },
  };
}