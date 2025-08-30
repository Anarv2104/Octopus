// backend/agents/slack.real.js
import fetch from "node-fetch";

/**
 * Posts a message to SLACK_CHANNEL_ID using SLACK_BOT_TOKEN.
 * Improvements:
 *  - If error is "not_in_channel", attempts to join public channels.
 *  - Surfaces Slack API error text so the dashboard shows why it failed.
 */
export async function slackRealAgent(ctx) {
  const { SLACK_BOT_TOKEN, SLACK_CHANNEL_ID, SLACK_WORKSPACE_ID } = process.env;
  if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID) {
    throw new Error("Slack env missing (SLACK_BOT_TOKEN / SLACK_CHANNEL_ID).");
  }

  const { instruction, memory } = ctx;
  const summary = memory?.lastSummary || instruction || "(no summary)";
  const fileUrl = memory?.fileUrl;

  const lines = [];
  lines.push(`*Octopus Update*`);
  if (instruction) lines.push(`*Instruction:* ${instruction}`);
  if (summary)    lines.push(`*Summary:* ${summary}`);
  if (fileUrl)    lines.push(`<${fileUrl}|Source File>`);
  const text = lines.join("\n");

  async function post() {
    const resp = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ channel: SLACK_CHANNEL_ID, text, mrkdwn: true }),
    });
    return resp.json();
  }

  let data = await post();

  // If bot not in channel, try to join (public channels only)
  if (!data.ok && data.error === "not_in_channel") {
    try {
      const joinResp = await fetch("https://slack.com/api/conversations.join", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ channel: SLACK_CHANNEL_ID }),
      });
      const join = await joinResp.json();
      if (join.ok) {
        data = await post(); // retry
      }
    } catch {
      // ignore join errors; we'll fall through to error surface below
    }
  }

  if (!data.ok) {
    throw new Error(`Slack post failed: ${data.error || "unknown_error"}`);
  }

  // Build deep link if we can
  let link = "#";
  if (data.ts) {
    const tsId = String(data.ts).replace(".", "");
    link = SLACK_WORKSPACE_ID
      ? `https://app.slack.com/client/${SLACK_WORKSPACE_ID}/${SLACK_CHANNEL_ID}/p${tsId}`
      : `https://slack.com/app_redirect?channel=${SLACK_CHANNEL_ID}`;
  }

  return {
    link,
    payload: { ok: true, ts: data.ts, channel: data.channel },
    memoryPatch: { lastSlackTs: data.ts },
  };
}