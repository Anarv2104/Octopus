// backend/agents/notion.real.js
import fetch from "node-fetch";

/**
 * Creates a page in NOTION_DB_ID with a title + the run summary.
 * - Auto-detect title property
 * - Splits long text into <= 1900-char chunks (Notion hard limit is 2000)
 * - Optional “Key Points” bulleted list if bullets are present
 * - Optional Source link block
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

  // fetch DB & find title prop
  const dbRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}`, {
    headers: { Authorization: `Bearer ${NOTION_TOKEN}`, "Notion-Version": "2022-06-28" },
  });
  if (!dbRes.ok) {
    const t = await dbRes.text().catch(() => "");
    const hint =
      dbRes.status === 404
        ? "Check NOTION_DB_ID (it must be a *database* id, not a page id)."
        : dbRes.status === 403
        ? "Integration not shared with this database (Share → Invite integration)."
        : "";
    throw new Error(`Notion: failed to fetch database: ${dbRes.status}. ${hint} ${t}`);
  }
  const db = await dbRes.json();
  let titleProp = null;
  for (const [key, prop] of Object.entries(db.properties || {})) {
    if (prop?.type === "title") { titleProp = key; break; }
  }
  if (!titleProp) throw new Error("Notion: could not find a title property on the database.");

  // chunk helper (keep headroom below 2000)
  const chunk = (txt, max = 1900) => {
    const out = [];
    let i = 0;
    while (i < txt.length) {
      out.push(txt.slice(i, i + max));
      i += max;
    }
    return out;
  };

  // detect bullet lines
  const bulletLines = summary
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[-*•]\s+/.test(l))
    .map((l) => l.replace(/^[-*•]\s+/, ""));

  const children = [];

  // Summary heading + paragraphs (chunked)
  children.push({
    object: "block",
    type: "heading_2",
    heading_2: { rich_text: [{ type: "text", text: { content: "Summary" } }] },
  });
  for (const part of chunk(summary)) {
    children.push({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: part } }] },
    });
  }

  // Key Points (bulleted list) if present
  if (bulletLines.length) {
    children.push({
      object: "block",
      type: "heading_2",
      heading_2: { rich_text: [{ type: "text", text: { content: "Key Points" } }] },
    });
    for (const b of bulletLines.slice(0, 20)) {
      for (const part of chunk(b)) {
        children.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ type: "text", text: { content: part } }] },
        });
      }
    }
  }

  // Source link
  if (fileUrl) {
    children.push(
      {
        object: "block",
        type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: "Source" } }] },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: fileUrl, link: { url: fileUrl } } }],
        },
      }
    );
  }

  // create page
  const createRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties: { [titleProp]: { title: [{ type: "text", text: { content: titleText } }] } },
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