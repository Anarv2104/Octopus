// backend/agents/gmail.real.js
import { google } from "googleapis";
import { getIntegration, setIntegration } from "../lib/db.js";

function buildOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
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

function makeEmail({ to, subject, text, from }) {
  // RFC 2822 format base64url
  const message =
    `From: ${from}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `Content-Type: text/plain; charset="UTF-8"\r\n` +
    `\r\n` +
    text;

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function gmailRealAgent(ctx) {
  const { uid, instruction, memory } = ctx;
  const cfg = await getIntegration(uid, "gmail"); // { defaultTo }
  const googleProfile = await getIntegration(uid, "google"); // { email }
  const from = googleProfile?.email || "me";
  const to = cfg?.defaultTo || googleProfile?.email || null;
  if (!to) throw new Error("No recipient email set (users/{uid}/integrations/gmail.defaultTo)");

  const subject = instruction?.slice(0, 140) || "Octopus Update";
  const body = memory?.lastSummary || instruction || "(no body)";

  const auth = await asGoogleClient(uid);
  const gmail = google.gmail({ version: "v1", auth });

  const raw = makeEmail({ to, from, subject, text: body });

  const send = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  // Try to build a permalink (Gmail web)
  const msgId = send?.data?.id;
  const link = msgId ? `https://mail.google.com/mail/u/0/#inbox/${msgId}` : "#";

  return {
    link,
    payload: { ok: true, id: msgId, to },
    memoryPatch: { lastEmailId: msgId, lastEmailTo: to },
  };
}