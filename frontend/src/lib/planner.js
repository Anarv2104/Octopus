// frontend/src/lib/planner.js
export function planTools(instruction, hasFile = false) {
  const s = (instruction || "").toLowerCase();

  const rules = [
    { tool: "notion",     match: /(notion|page|doc|write up|spec|notes?)/ },
    { tool: "sheets",     match: /(sheet|sheets|spreadsheet|csv|table|rows?)/ },
    { tool: "github",     match: /(github|issue|bug|ticket|repo|pull request|pr)/ },
    { tool: "slack",      match: /(slack|post|notify|announce|channel|dm)/ },
    { tool: "email",      match: /(email|mail|send to|gmail|outlook)/ },
    { tool: "summarizer", match: /(summary|summarize|tl;dr|brief|condense|extract)/ },
  ];

  const out = [];
  for (const r of rules) if (r.match.test(s)) out.push(r.tool);
  if (out.length === 0) out.push("summarizer");

  const uniq = [...new Set(out)];
  if (hasFile && !uniq.includes("summarizer")) uniq.unshift("summarizer");
  return uniq;
}