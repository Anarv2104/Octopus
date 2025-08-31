// backend/agents/index.js
import { summarizerAgent } from "./summarizer.js";

/** Feature flags */
const hasGoogleOAuth = () =>
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  !!process.env.GOOGLE_REDIRECT_URI;

const useNotion = () => !!process.env.NOTION_TOKEN && !!process.env.NOTION_DB_ID;
const useSlack  = () => !!process.env.SLACK_BOT_TOKEN && !!process.env.SLACK_CHANNEL_ID;
const useSheets = hasGoogleOAuth;   // callable predicate
const useEmail  = hasGoogleOAuth;   // callable predicate

// GitHub multi-tenant via OAuth
const useGithubOAuth = () =>
  !!process.env.GITHUB_CLIENT_ID &&
  !!process.env.GITHUB_CLIENT_SECRET &&
  !!process.env.GITHUB_REDIRECT_URI;

// Keep PAT fallback (if you ever need it again)
const useGithubPAT = () =>
  !!process.env.GITHUB_TOKEN && !!process.env.GITHUB_OWNER && !!process.env.GITHUB_REPO;

/** Stubs */
const stubs = {
  notion: async () => ({ link: "#", payload: { ok: true, stub: "notion" },  memoryPatch: {} }),
  slack:  async () => ({ link: "#", payload: { ok: true, stub: "slack" },   memoryPatch: {} }),
  sheets: async () => ({ link: "#", payload: { ok: true, stub: "sheets" },  memoryPatch: {} }),
  github: async () => ({ link: "#", payload: { ok: true, stub: "github" },  memoryPatch: {} }),
  email:  async () => ({ link: "#", payload: { ok: true, stub: "email" },   memoryPatch: {} }),
};

async function loadReal(tool) {
  try {
    switch (tool) {
      case "notion": return (await import("./notion.real.js")).notionRealAgent;
      case "slack":  return (await import("./slack.real.js")).slackRealAgent;
      case "sheets": return (await import("./sheets.real.js")).sheetsRealAgent;
      case "github": return (await import("./github.real.js")).githubRealAgent;
      case "email":  return (await import("./email.real.js")).emailRealAgent;
      default:       return null;
    }
  } catch {
    return null; // fall back to stub if real agent file missing or throws
  }
}

export async function runAgent(tool, ctx) {
  if (tool === "summarizer") return summarizerAgent(ctx);

  if (tool === "notion" && useNotion()) {
    const real = await loadReal("notion"); if (real) return real(ctx);
  }
  if (tool === "slack" && useSlack()) {
    const real = await loadReal("slack"); if (real) return real(ctx);
  }
  if (tool === "sheets" && useSheets()) {
    const real = await loadReal("sheets"); if (real) return real(ctx);
  }
  if (tool === "github" && (useGithubOAuth() || useGithubPAT())) {
    const real = await loadReal("github"); if (real) return real(ctx);
  }
  if (tool === "email" && useEmail()) {
    const real = await loadReal("email"); if (real) return real(ctx);
  }

  // Fall back to stub
  if (stubs[tool]) return stubs[tool](ctx);
  return { link: "#", payload: { ok: false, note: `Unknown tool: ${tool}` } };
}