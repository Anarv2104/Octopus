// frontend/src/lib/planner.js
export function planTools(instruction, hasFile = false) {
  const s = (instruction || "").toLowerCase();

  const rules = [
    // Notion
    { tool: "notion",     match: /(notion|page|doc|write[\s-]?up|spec|notes?\b|knowledge base|kb)/ },
    // Google Sheets
    { tool: "sheets",     match: /(sheet|sheets|spreadsheet|csv|table|rows?|append|log to sheet)/ },
    // GitHub (kept for later OAuth work)
    { tool: "github",     match: /(github|issue|bug|ticket|repo|pull request|pr|create tasks?)/ },
    // Slack
    { tool: "slack",      match: /(slack|post|notify|announce|channel|dm|message team)/ },
    // Email
    { tool: "email",      match: /(email|mail|send to|gmail|outlook)/ },
    // Summarizer
    { tool: "summarizer", match: /(summary|summarize|tl;?dr|brief|condense|extract)/ },
  ];

  const out = [];
  for (const r of rules) {
    if (r.match.test(s)) out.push(r.tool);
  }

  // If nothing matched, default to summarizer
  if (out.length === 0) out.push("summarizer");

  // Ensure summarizer runs first when a file is attached and summarizer isn't already present
  const uniq = [...new Set(out)];
  if (hasFile && !uniq.includes("summarizer")) uniq.unshift("summarizer");
  return uniq;
}