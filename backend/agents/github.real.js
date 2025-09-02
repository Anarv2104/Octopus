// backend/agents/github.real.js
import { getIntegration } from "../lib/db.js";

const GH_API = "https://api.github.com";

/** ----- helpers ----- **/

// Accepts:
//   - owner/repo
//   - "in my repo X", "in repo X", "repo named X", "repository X", "in X"
//   - plain "... X repo"
function parseTargetRepo(instruction = "") {
  const s = (instruction || "").toLowerCase();

  // owner/repo
  const m1 = s.match(/\b([a-z0-9_.-]+)\/([a-z0-9_.-]+)\b/i);
  if (m1) return { owner: m1[1], repo: m1[2] };

  // common “repo <name>” phrasings
  const patterns = [
    /\bmy\s+repo\s+([a-z0-9_.-]+)\b/i,
    /\brepo\s+named\s+([a-z0-9_.-]+)\b/i,
    /\brepository\s+([a-z0-9_.-]+)\b/i,
    /\bin\s+repo\s+([a-z0-9_.-]+)\b/i,
    /\bin\s+my\s+repo\s+([a-z0-9_.-]+)\b/i,
    /\bin\s+([a-z0-9_.-]+)\s+repo\b/i,
    /\bin\s+([a-z0-9_.-]+)\b/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return { owner: null, repo: m[1] };
  }

  return null;
}

function extractBullets(summary = "") {
  const lines = (summary || "").split(/\r?\n/);
  return lines
    .map((l) => l.trim())
    .filter((l) => /^[-*•]\s+/.test(l))
    .map((l) => l.replace(/^[-*•]\s+/, ""))
    .slice(0, 15);
}

async function ghFetch(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) {
    const txt = await r.text().catch(() => r.statusText);
    const err = new Error(`GitHub API ${r.status}: ${txt}`);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

/** Try to resolve owner if only a repo name was provided. */
async function resolveOwnerForRepo(accessToken, repoName) {
  // 1) Try user login first
  const me = await ghFetch(`${GH_API}/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
  });
  const login = me?.login;

  // Check user/<repo>
  try {
    const found = await ghFetch(`${GH_API}/repos/${login}/${repoName}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
    });
    if (found?.owner?.login && found?.name) {
      return { owner: found.owner.login, repo: found.name };
    }
  } catch (_) {
    /* ignore 404 here */
  }

  // 2) Scan repos the user can access (owner/collaborator/org_member)
  const repos = await ghFetch(
    `${GH_API}/user/repos?per_page=100&affiliation=owner,collaborator,organization_member`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" } }
  );
  const match = repos.find((r) => r?.name?.toLowerCase() === repoName.toLowerCase());
  if (match) return { owner: match.owner?.login, repo: match.name };

  return null;
}

/** ----- main agent ----- **/
export async function githubRealAgent(ctx) {
  const { uid, instruction, memory } = ctx;

  // 1) token + login
  const gh = await getIntegration(uid, "github");
  if (!gh?.access_token) throw new Error("GitHub not connected for this user.");
  const accessToken = gh.access_token;

  // 2) repo target
  let parsed = parseTargetRepo(instruction);
  let owner = parsed?.owner || null;
  let repo = parsed?.repo || null;

  // If only repo name was present, resolve actual owner (user or org)
  if (!owner && repo) {
    const resolved = await resolveOwnerForRepo(accessToken, repo);
    if (resolved) ({ owner, repo } = resolved);
    else if (gh.login) owner = gh.login; // last resort guess
  }

  // If still missing, try last repo from memory (helps subsequent runs)
  if ((!owner || !repo) && memory?.lastGithubRepo) {
    const [o, r] = String(memory.lastGithubRepo).split("/");
    if (o && r) { owner = owner || o; repo = repo || r; }
  }

  // 3) prepare content
  const summary  = memory?.lastSummary || instruction || "No summary provided.";
  const bestLink = memory?.lastNotionUrl || memory?.fileUrl || null;
  const bullets = extractBullets(summary);

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "octopus-app",
  };

  /** If we cannot confidently target a repo, don’t block the chain. */
  if (!owner || !repo) {
    const note = "No repository resolved. Include `owner/repo` or the exact repo name in your prompt.";
    return {
      link: "https://github.com/issues",
      payload: { ok: true, note, created: 0 },
      memoryPatch: { githubHint: note },
    };
  }

  // 4) sanity check repo exists for this token (gives nicer 404)
  try {
    await ghFetch(`${GH_API}/repos/${owner}/${repo}`, { headers });
  } catch (e) {
    const msg = `Cannot access ${owner}/${repo}. Does it exist and is your GitHub account allowed?`;
    throw new Error(msg);
  }

  // 5) helper to build final issue body with References (idempotent)
  const withReferences = (body) => {
    if (!bestLink) return body;
    if (body.includes(bestLink)) return body;
    return /\n##\s*References\b/i.test(body)
      ? `${body}\n- ${bestLink}\n`
      : `${body}\n\n## References\n- ${bestLink}\n`;
  };

  // 6) create issues
  const createIssue = async (title, body) => {
    const r = await fetch(`${GH_API}/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title, body }),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => r.statusText);
      throw new Error(`GitHub issue create failed: ${r.status} ${txt}`);
    }
    return r.json();
  };

  const created = [];
  if (bullets.length >= 2) {
    for (const b of bullets) {
      const t = b.slice(0, 120) || "Task";
      const body = withReferences(summary);
      const issue = await createIssue(t, body);
      created.push(issue);
    }
  } else {
    const title = (instruction || "Octopus task").slice(0, 120);
    const body = withReferences(summary);
    created.push(await createIssue(title, body));
  }

  const issuesUrl = `https://github.com/${owner}/${repo}/issues`;
  const firstUrl = created[0]?.html_url || issuesUrl;

  return {
    link: firstUrl,
    payload: {
      ok: true,
      owner,
      repo,
      count: created.length,
      issueUrls: created.map((i) => i.html_url || issuesUrl),
    },
    memoryPatch: { lastGithubRepo: `${owner}/${repo}` },
  };
}