// backend/agents/index.js
import { summarizerAgent } from "./summarizer.js";

/**
 * Minimal stubs for non-summarizer tools.
 * Replace these with real integrations later.
 */
const stubs = {
  notion: async (_ctx) => ({ link: "#", payload: { ok: true, note: "notion (stub)" } }),
  sheets: async (_ctx) => ({ link: "#", payload: { ok: true, note: "sheets (stub)" } }),
  github: async (_ctx) => ({ link: "#", payload: { ok: true, note: "github (stub)" } }),
  slack:  async (_ctx) => ({ link: "#", payload: { ok: true, note: "slack (stub)" } }),
  email:  async (_ctx) => ({ link: "#", payload: { ok: true, note: "email (stub)" } }),
};

/**
 * Single source of truth for running agents.
 * `ctx` should include:
 *   - instruction: string
 *   - memory: object (may contain `fileUrl` if a file was attached)
 */
export async function runAgent(tool, ctx) {
  if (tool === "summarizer") {
    // summarizerAgent reads ctx.memory.fileUrl internally
    return summarizerAgent(ctx);
  }

  if (stubs[tool]) {
    return stubs[tool](ctx);
  }

  // Unknown tool
  return { link: "#", payload: { ok: false, note: `Unknown tool: ${tool}` } };
}