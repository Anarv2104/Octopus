// backend/lib/googleAuth.js
import { google } from "googleapis";
import { getIntegration, setIntegration } from "./db.js";

export function buildOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Returns an OAuth2 client for user `uid` that:
 *  - loads saved tokens
 *  - persists refreshed tokens automatically
 *  - proactively refreshes if token is near expiry
 */
export async function asGoogleClient(uid) {
  const saved = await getIntegration(uid, "google");
  if (!saved?.access_token && !saved?.refresh_token) {
    throw new Error("Google account not connected");
  }

  const oauth = buildOAuthClient();
  oauth.setCredentials({
    access_token: saved.access_token || undefined,
    refresh_token: saved.refresh_token || undefined,
    expiry_date: saved.expiry_date || undefined,
    scope: saved.scope || undefined,
  });

  // Persist any refreshed tokens without losing known fields (like email/scope)
  oauth.on("tokens", async (tokens) => {
    const updated = {
      access_token: tokens.access_token ?? saved.access_token ?? null,
      refresh_token: tokens.refresh_token ?? saved.refresh_token ?? null,
      scope: tokens.scope ?? saved.scope,
      email: saved.email ?? null,
    };
    if (typeof tokens.expiry_date === "number") {
      updated.expiry_date = tokens.expiry_date;
    } else if (typeof tokens.expires_in === "number") {
      updated.expiry_date = Date.now() + tokens.expires_in * 1000;
    } else {
      updated.expiry_date = saved.expiry_date;
    }
    await setIntegration(uid, "google", updated);
  });

  // Proactive refresh if missing/near expiry (<60s left) and we have a refresh_token
  const needsRefresh = !saved.expiry_date || (Date.now() > (saved.expiry_date - 60_000));
  if (needsRefresh && saved.refresh_token) {
    try {
      await oauth.getAccessToken(); // triggers refresh under the hood
    } catch {
      // non-fatal: Gmail/Sheets calls will also refresh on first API call
    }
  }

  return oauth;
}