// backend/agents/index.js
import { handle as summarizer } from "./summarizer.stub.js";
import { handle as notion } from "./notion.stub.js";
import { handle as slack } from "./slack.stub.js";
import { handle as github } from "./github.stub.js";
import { handle as email } from "./email.stub.js";
import { handle as sheets } from "./sheets.stub.js";

const registry = { summarizer, notion, slack, github, email, sheets };

export function hasAgent(name) {
  return Boolean(registry[name]);
}

export async function runAgent(tool, ctx) {
  const h = registry[tool];
  if (!h) throw new Error(`Unknown agent: ${tool}`);
  return await h(ctx);
}