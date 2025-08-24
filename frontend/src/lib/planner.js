// Returns a deduped, ordered tool list derived from the instruction text.
// We keep it simple, deterministic, and readable for MVP.
export function planTools(instruction) {
  const s = (instruction || "").toLowerCase();

  const rules = [
    { tool: "notion",      match: /(notion|page|doc|write up|spec|notes?)/ },
    { tool: "sheets",      match: /(sheet|sheets|spreadsheet|csv|table|rows?)/ },
    { tool: "github",      match: /(github|issue|bug|ticket|repo|pull request|pr)/ },
    { tool: "slack",       match: /(slack|post|notify|announce|channel|dm)/ },
    { tool: "email",       match: /(email|mail|send to|gmail|outlook)/ },
    { tool: "summarizer",  match: /(summary|summarize|tl;dr|brief|condense|extract)/ },
  ];

  const out = [];
  for (const r of rules) {
    if (r.match.test(s)) out.push(r.tool);
  }
  // Fallback: if nothing matched, we still give them a useful default
  if (out.length === 0) out.push("summarizer");
  return [...new Set(out)];
}