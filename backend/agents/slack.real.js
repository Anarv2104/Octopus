// backend/agents/slack.real.js
import { WebClient } from "@slack/web-api";

/**
 * Posts a short status update to a channel.
 * Uses lastSummary or instruction as the message body.
 */
export async function slackRealAgent(ctx) {
  const token  = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!token || !channel) {
    return { link: "#", payload: { ok: false, note: "Slack env not set" } };
  }

  const slack = new WebClient(token);

  const body =
    ctx?.memory?.lastSummary ||
    ctx?.payload?.summary ||
    `Octopus update: ${ctx?.instruction || "(no instruction)"}`;

  const resp = await slack.chat.postMessage({
    channel,
    text: body.slice(0, 3500), // Slack text limit safety
  });

  // Try to build a link to the message if response contains ts + channel
  const ts = resp?.ts;
  const ch = resp?.channel;
  const link = ts && ch ? `https://app.slack.com/client/${ch?.startsWith("D") ? "T" : ""}/${ch}/thread/${ch}-${ts}` : "#";

  return {
    link,
    payload: { ok: true, ts, channel: ch },
    memoryPatch: { lastSlackTs: ts, lastSlackChannel: ch },
  };
}