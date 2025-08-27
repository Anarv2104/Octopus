import { WebClient } from "@slack/web-api";

export async function slackRealAgent(ctx) {
  const token   = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!token || !channel) {
    return { link: "#", payload: { ok: false, note: "Slack env not set" } };
  }

  const slack = new WebClient(token);

  const body =
    ctx?.memory?.lastSummary ||
    ctx?.payload?.summary ||
    `Octopus update: ${ctx?.instruction || "(no instruction)"}`;

  const post = await slack.chat.postMessage({
    channel,
    text: body.slice(0, 3500),
  });

  const ch = post?.channel;
  const ts = post?.ts;

  let permalink = "#";
  try {
    const pl = await slack.chat.getPermalink({ channel: ch, message_ts: ts });
    permalink = pl?.permalink || "#";
  } catch {}

  return {
    link: permalink,
    payload: { ok: true, channel: ch, ts },
    memoryPatch: { lastSlackTs: ts, lastSlackChannel: ch, lastSlackPermalink: permalink },
  };
}