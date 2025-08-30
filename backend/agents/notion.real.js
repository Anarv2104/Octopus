// backend/agents/notion.real.js
import fetch from "node-fetch";

/**
 * Creates a page in NOTION_DB_ID with a title + the run summary.
 * Improvements:
 *  - Auto-detects the database's title property (no env mismatch).
 *  - Clear error messages (permission, bad DB id, etc.).
 *  - Optional link back to source file.
 */
export async function notionRealAgent(ctx) {
  const { NOTION_TOKEN, NOTION_DB_ID } = process.env;
  if (!NOTION_TOKEN || !NOTION_DB_ID) {
    throw new Error("Notion env missing: NOTION_TOKEN and NOTION_DB_ID are required.");
  }

  const { instruction, memory } = ctx;
  const summary = memory?.lastSummary || instruction || "(no summary)";
  const fileUrl = memory?.fileUrl || null;
  const titleText = (instruction || "Octopus Output").slice(0, 120);

  // 1) Fetch database to discover the title property key
  const dbRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}`, {
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
    },
  });

  if (!dbRes.ok) {
    const t = await dbRes.text().catch(() => "");
    // Common helpful hints
    const hint =
      dbRes.status === 404
        ? "Check NOTION_DB_ID (it must be a *database* id, not a page id)."
        : dbRes.status === 403
        ? "Your Notion integration likely isn’t shared with this database. In Notion: open the DB → Share → Invite your integration."
        : "";
    throw new Error(`Notion: failed to fetch database: ${dbRes.status}. ${hint} ${t}`);
  }
  const db = await dbRes.json();

  // Find the title property automatically
  let titleProp = null;
  for (const [key, prop] of Object.entries(db.properties || {})) {
    if (prop?.type === "title") {
      titleProp = key;
      break;
    }
  }
  if (!titleProp) {
    throw new Error("Notion: could not find a title property on the database.");
  }

  // 2) Build blocks
  const children = [
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
  ];

  if (fileUrl) {
    children.push(
      {
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: "Source" } }] },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { type: "text", text: { content: fileUrl, link: { url: fileUrl } } },
          ],
        },
      }
    );
  }

  // 3) Create the page
  const createRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        [titleProp]: { title: [{ type: "text", text: { content: titleText } }] },
      },
      children,
    }),
  });

  if (!createRes.ok) {
    const msg = await createRes.text().catch(() => createRes.statusText);
    throw new Error(`Notion create failed: ${createRes.status} ${msg}`);
  }

  const data = await createRes.json();
  const url = data?.url || "#";
  return {
    link: url,
    payload: { ok: true, pageId: data?.id || null, url },
    memoryPatch: { lastNotionUrl: url },
  };
}