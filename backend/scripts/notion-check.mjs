// scripts/notion-check.mjs
import "dotenv/config";
import fetch from "node-fetch";

/**
 * Quick sanity check:
 *   - Reads NOTION_TOKEN and NOTION_DB_ID from .env
 *   - Fetches the DB metadata (200 = good; 403/404 = sharing/id issue)
 * Run:
 *   node scripts/notion-check.mjs
 */
async function main() {
  const { NOTION_TOKEN, NOTION_DB_ID } = process.env;

  if (!NOTION_TOKEN || !NOTION_DB_ID) {
    console.error("ERROR: NOTION_TOKEN and NOTION_DB_ID must be set in backend/.env");
    process.exit(1);
  }

  const url = `https://api.notion.com/v1/databases/${NOTION_DB_ID}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
    },
  });

  const txt = await r.text().catch(() => "");
  console.log("Status:", r.status);
  console.log("Body:", txt);

  if (r.ok) {
    console.log("\n✅ Looks good. The DB is reachable with this token.");
  } else if (r.status === 403) {
    console.log("\n⛔ 403 Forbidden: The integration is probably NOT shared with this database.");
    console.log("   In Notion: open the database → ••• (top-right) → Connections → Add connection → pick your integration.");
  } else if (r.status === 404) {
    console.log("\n⛔ 404 Not Found: The NOTION_DB_ID is wrong (or not a database id).");
    console.log("   Copy the 32-char hex ID from the database URL BEFORE ?v=…");
  }
}

main().catch((e) => {
  console.error("Unexpected error:", e?.message || e);
  process.exit(1);
});