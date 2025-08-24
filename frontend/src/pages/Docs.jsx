// src/pages/Docs.jsx
import Sidebar from "../components/docs/Sidebar";
import CodeBlock from "../components/docs/CodeBlock";
import PropTypes from "prop-types";

const curlExample = `curl -X POST https://api.octopus.run/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "octopus-pro",
    "messages": [
      {"role": "user", "content": "Create a Notion page and post a Slack update"}
    ]
  }'`;

const jsExample = `import Octopus from "@octopus-ai/sdk";

const client = new Octopus({ apiKey: process.env.OCTOPUS_API_KEY });

const run = await client.runs.create({
  instruction: "Summarize this doc and add to Notion; share on Slack",
});

await client.runs.execute(run.id);`;

export default function Docs() {
  const handleNav = (e) => {
    const hash = e.currentTarget.getAttribute("href");
    if (hash?.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="bg-[#0d0d0d] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16 flex gap-10">
        <Sidebar onNavigate={handleNav} />

        <article className="min-w-0 flex-1">
          {/* Page header */}
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold">Documentation</h1>
            <p className="text-white/70 mt-3">
              Build with Octopus. Quickstart, prompting best-practices, and platform details.
            </p>
          </header>

          {/* Overview */}
          <section id="overview" className="scroll-mt-24">
            <h2 className="text-2xl font-medium">Overview</h2>
            <p className="text-white/70 mt-3">
              Octopus turns a single instruction into a coordinated multi-tool workflow.
              Use the REST API or our lightweight SDK to create a <em>run</em>,
              then execute it to perform steps across Notion, Sheets, GitHub, Slack, email, and more.
            </p>
          </section>

          {/* Quickstart */}
          <section id="quickstart" className="mt-12 scroll-mt-24">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-medium">Quickstart</h2>
              <button
                className="text-xs px-2 py-1 rounded-md border border-neutral-700 hover:border-neutral-600"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Copy page
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <CodeBlock title="curl" code={curlExample} lang="bash" />
              <CodeBlock title="javascript" code={jsExample} lang="javascript" />
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <Card title="Models" body="Explore model options and capabilities." href="#" />
              <Card title="API Reference" body="Full endpoint documentation with specs." href="#" />
              <Card title="Examples" body="Code patterns for common workflows." href="#" />
              <Card title="Guides" body="Deep dives into prompting, streaming, and more." href="#prompt-guide" />
            </div>
          </section>

          {/* Prompt Guide */}
          <section id="prompt-guide" className="mt-16 scroll-mt-24">
            <h2 className="text-2xl font-medium">Prompt Guide</h2>
            <p className="text-white/70 mt-3">
              You’ll get better results if you’re explicit about outcomes and tools.
              Keep instructions crisp; add just enough context to ground the task.
            </p>

            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <BestPractice
                title="Be Specific & Contextual"
                good="Compare roadmap items by priority and owner; create GitHub issues for the top 3."
                bad="Help me plan my work."
              />
              <BestPractice
                title="Think Like a Web Search"
                good="Summarize the latest trends in vector databases for 2025 with 3 citations."
                bad="Tell me about databases."
              />
              <BestPractice
                title="Provide Relevant Inputs"
                good="Summarize the attached meeting notes, then draft a Notion page with key actions."
                bad="Write a summary."
              />
              <BestPractice
                title="Avoid Few-Shot Prompting"
                good="Ask for the outcome directly with clear structure."
                bad="Don’t dump multiple generic examples."
              />
            </div>
          </section>

          {/* Structured outputs */}
          <section id="structured-outputs" className="mt-16 scroll-mt-24">
            <h2 className="text-2xl font-medium">Structured Outputs</h2>
            <p className="text-white/70 mt-3">
              For integrations, return JSON with explicit fields (title, url, status).
              Validate on your end before persisting to databases.
            </p>
          </section>

          {/* Platform sections */}
          <section id="supported-devices" className="mt-16 scroll-mt-24">
            <h2 className="text-2xl font-medium">Supported Devices</h2>
            <ul className="mt-3 list-disc list-inside text-white/70 space-y-1">
              <li>Modern Chromium browsers (latest 2 versions)</li>
              <li>Safari 16+</li>
              <li>Firefox (latest 2 versions)</li>
              <li>Mobile Safari / Chrome on iOS 16+, Android 12+</li>
            </ul>
          </section>

          <section id="system-requirements" className="mt-12 scroll-mt-24">
            <h2 className="text-2xl font-medium">System Requirements</h2>
            <ul className="mt-3 list-disc list-inside text-white/70 space-y-1">
              <li>JavaScript enabled; localStorage for session</li>
              <li>
                Network access to <code>api.octopus.run</code> and Google/Firebase
              </li>
              <li>Recommended: 8GB RAM device for heavy dashboards</li>
            </ul>
          </section>

          <footer className="h-24" />
        </article>
      </div>
    </main>
  );
}

/* helpers */
function Card({ title, body, href }) {
  return (
    <a
      href={href}
      className="block rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 hover:bg-neutral-900 transition"
    >
      <div className="text-white font-medium">{title}</div>
      <div className="text-white/60 text-sm mt-1.5">{body}</div>
    </a>
  );
}

Card.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
};

function BestPractice({ title, good, bad }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="font-medium">{title}</div>
      <div className="mt-3 text-sm">
        <div className="text-emerald-400/90">Good:</div>
        <p className="text-white/80">{good}</p>
      </div>
      <div className="mt-3 text-sm">
        <div className="text-red-400/90">Avoid:</div>
        <p className="text-white/60">{bad}</p>
      </div>
    </div>
  );
}

BestPractice.propTypes = {
  title: PropTypes.string.isRequired,
  good: PropTypes.string.isRequired,
  bad: PropTypes.string.isRequired,
};