// backend/agents/notion.real.js
import { Client } from "@notionhq/client";

/**
 * Creates a page in a database using either:
 *  - ctx.memory.lastSummary (from the summarizer), or
 *  - ctx.instruction as a fallback.
 * Returns the public URL (notion canonical share link).
 */
export async function notionRealAgent(ctx) {
  const token = process.env.NOTION_TOKEN;
  const dbId  = process.env.NOTION_DB_ID;
  if (!token || !dbId) {
    return { link: "#", payload: { ok: false, note: "Notion env not set" } };
  }

  const notion = new Client({ auth: token });

  const summary =
    ctx?.memory?.lastSummary ||
    ctx?.payload?.summary ||
    ctx?.instruction ||
    "No summary available.";

  const title = (ctx?.instruction || "Octopus Write-up").slice(0, 200);

  const page = await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      Title: {
        title: [{ type: "text", text: { content: title } }],
      },
    },
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: "Summary" } }] },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: summary } }] },
      },
    ],
  });

  const url = page?.url || "#";
  return {
    link: url,
    payload: { ok: true, url },
    memoryPatch: { lastNotionPageUrl: url },
  };
}