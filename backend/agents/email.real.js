// backend/agents/email.real.js
import { google } from "googleapis";
import { getIntegration } from "../lib/db.js";
import { asGoogleClient } from "../lib/googleAuth.js";

/* ---------------- helpers ---------------- */

function base64Url(str) {
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** RFC 2047 header encoding for non-ASCII (e.g., smart quotes, en dashes) */
function encodeMimeHeader(value = "") {
  if (/^[\x00-\x7F]*$/.test(value)) return value; // ASCII → no encoding needed
  const b64 = Buffer.from(value, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

/** Readable YYYY-MM-DD */
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Turn URLs in plain text into <a> links; escape everything else */
function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function linkify(html = "") {
  return html.replace(/\b(https?:\/\/[^\s)]+)\b/g, (m) => `<a href="${m}">${m}</a>`);
}
/** Simple HTML body; shows bullets if present */
function toHtmlBody(text = "") {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const bullets = lines.filter((l) => /^[-*•]\s+/.test(l)).map((l) => l.replace(/^[-*•]\s+/, ""));
  if (bullets.length) {
    const lis = bullets.map((b) => `<li>${linkify(escapeHtml(b))}</li>`).join("\n");
    return `<div>
      <h3>Summary</h3>
      <ul>${lis}</ul>
      <h4>Details</h4>
      <pre style="white-space:pre-wrap">${linkify(escapeHtml(text))}</pre>
    </div>`;
  }
  return `<div><pre style="white-space:pre-wrap">${linkify(escapeHtml(text))}</pre></div>`;
}

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const isValidEmail = (s) => EMAIL_RE.test(String(s || "").trim());

function splitEmails(chunk = "") {
  if (!chunk) return [];
  return chunk
    .replace(/\b(?:to|my\s+boss\s+at|at)\b\s*/gi, "")
    .split(/[,;]|\s+\band\b\s+/gi)
    .map((t) => t.trim().replace(/[),.;:]+$/g, ""))
    .filter((t) => isValidEmail(t));
}
function dedup(list) { return Array.from(new Set(list)); }

/* ---------------- natural-language extraction ---------------- */

// Subject: prefer explicit “Subject: …”, then quoted text, else first 180 chars
function extractSubject(instruction = "") {
  const s = instruction || "";
  const m1 = s.match(/subject\s*:\s*(.+)$/im);
  if (m1?.[1]) return m1[1].trim().slice(0, 180);
  const m2 = s.match(/[“"](.*?)[”"]/); // smart/straight quotes
  if (m2?.[1]) return m2[1].trim().slice(0, 180);
  return s.slice(0, 180) || "Octopus Update";
}

// To: supports “to: …”, “email/send to …”, or any email present
function extractTo(instruction = "") {
  const s = instruction || "";
  const mToLabel = s.match(/\bto\s*:\s*([^\s,;()<>]+@[^\s,;()<>]+)/i);
  if (mToLabel?.[1]) return mToLabel[1];
  const mVerb = s.match(/(?:email|mail|send)\s+(?:it|this|summary|report)?\s*(?:to|at)\s*([^\s,;()<>]+@[^\s,;()<>]+)/i);
  if (mVerb?.[1]) return mVerb[1];
  const any = s.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return any?.[0] || null;
}

// CC/BCC: handles “cc: a@b, c@d”, “CC a@b and x@y”, or inside parentheses
function extractCcBcc(instruction = "") {
  const s = instruction || "";
  const foundCc = [];
  const foundBcc = [];
  const regex = /\b(cc|bcc)\b\s*:?\s*([^\n)]+)/gi; // capture until EOL or ')'
  let m;
  while ((m = regex.exec(s)) !== null) {
    const label = m[1].toLowerCase();
    const emails = splitEmails(m[2] || "");
    if (label === "cc") foundCc.push(...emails);
    else foundBcc.push(...emails);
  }
  return { cc: dedup(foundCc), bcc: dedup(foundBcc) };
}

/** Placeholder expansion for both subject & body */
function expandTemplates(str = "", { summary, link }) {
  return (str || "")
    .replace(/\{today\}/gi, todayISO())
    .replace(/\{summary\}/gi, summary || "")
    .replace(/\{link\}/gi, link || "");
}

/** Build multipart/alternative message */
function buildMime({ to, cc = [], bcc = [], subject, text, html }) {
  const altBoundary = "ALT_PART_" + Math.random().toString(36).slice(2);
  const headers = [
    `To: ${to}`,
    ...(cc.length ? [`Cc: ${cc.join(", ")}`] : []),
    ...(bcc.length ? [`Bcc: ${bcc.join(", ")}`] : []),
    `Subject: ${encodeMimeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
  ];
  const parts = [
    `--${altBoundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    text,
    `--${altBoundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    html,
    `--${altBoundary}--`,
    "",
  ];
  return headers.join("\r\n") + "\r\n\r\n" + parts.join("\r\n");
}

/* ---------------- main agent ---------------- */

export async function emailRealAgent(ctx) {
  const { uid, instruction, memory } = ctx;

  // OAuth client with token load/refresh/persist
  const auth = await asGoogleClient(uid);
  const gmail = google.gmail({ version: "v1", auth });

  // Resolve recipients
  const parsedTo = extractTo(instruction);
  const savedCfg = await getIntegration(uid, "email"); // optional: { to: "..." }
  let to = parsedTo || savedCfg?.to || process.env.DEV_FALLBACK_EMAIL;

  // ✅ ensure To is deliverable (don’t allow “you@domain.com” / invalid to block CC/BCC)
  if (!isValidEmail(to) || /you@domain\.com/i.test(to)) {
    to = process.env.DEV_FALLBACK_EMAIL || savedCfg?.to || null;
  }
  if (!to) {
    return { link: "#", payload: { ok: false, note: "No recipient. Set integrations/email.to or DEV_FALLBACK_EMAIL." } };
  }

  // CC/BCC
  let { cc, bcc } = extractCcBcc(instruction);

  // de-dup across all lists, and remove any accidental duplicates of "to"
  const all = dedup([to, ...cc, ...bcc].filter(Boolean));
  to = all.shift();
  const toSet = new Set([to]);
  cc = all.filter((e) => !toSet.has(e)).slice(0); // remaining become CC by default
  // Keep any explicit BCC that were parsed but not already in To/CC
  const explicitBcc = extractCcBcc(instruction).bcc.filter((e) => !toSet.has(e) && !cc.includes(e));
  bcc = dedup(explicitBcc);

  // Summary + best link for {link}
  const summary = memory?.lastSummary || instruction || "(no content)";
  const bestLink = memory?.lastNotionUrl || memory?.fileUrl || null;

  // Subject (with templates)
  const rawSubject = extractSubject(instruction);
  const subject = expandTemplates(rawSubject, { summary, link: bestLink });

  // Body (with templates) — default to summary
  const rawBody = summary;
  const textBody = expandTemplates(rawBody, { summary, link: bestLink });
  const htmlBody = expandTemplates(toHtmlBody(rawBody), { summary, link: bestLink });

  // Build MIME
  const mime = buildMime({ to, cc, bcc, subject, text: textBody, html: htmlBody });

  // Send
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: base64Url(mime) },
  });

  const id = res?.data?.id;
  const threadId = res?.data?.threadId;
  const link =
    (id && `https://mail.google.com/mail/u/0/#all/${id}`) ||
    (threadId && `https://mail.google.com/mail/u/0/#inbox/${threadId}`) ||
    "#";

  return {
    link,
    payload: { ok: true, id, threadId, to, cc, bcc, usedSummary: !!summary },
    memoryPatch: { lastEmailId: id, lastEmailTo: to },
  };
}