import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { planTools } from "../lib/planner";
import { createRun, getRun, executeRun } from "../lib/api";

export default function Dashboard() {
  const { user, idToken } = useAuth();
  const [instruction, setInstruction] = useState("");
  const [tools, setTools] = useState([]);
  const [runId, setRunId] = useState(null);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const pollTimer = useRef(null);

  // derive tools from instruction
  useEffect(() => {
    setTools(planTools(instruction));
  }, [instruction]);

  // helper
  const allDone = (r) => r?.steps?.every(s => s.status === "done" || s.status === "failed");

  // continuous polling when we have a runId
  useEffect(() => {
    if (!runId || !idToken) return;

    let aborted = false;

    async function tick() {
      try {
        const r = await getRun(idToken, runId);
        if (aborted) return;
        setRun(r);
        if (!allDone(r)) {
          pollTimer.current = setTimeout(tick, 900);   // keep polling while running
        } else {
          setLoading(false);                           // finished
        }
      } catch (e) {
        if (aborted) return;
        // backoff retry
        pollTimer.current = setTimeout(tick, 1200);
      }
    }

    tick();

    return () => {
      aborted = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [runId, idToken]);

  const startRun = async () => {
    setErr("");
    if (!instruction.trim()) return;

    try {
      setLoading(true);
      setRun(null);
      setRunId(null);

      const { id } = await createRun(idToken, { instruction, tools });
      setRunId(id);

      // fire-and-forget execution; polling effect above will pick up progress
      await executeRun(idToken, id);
    } catch (e) {
      setLoading(false);
      setErr(e.message || "Something went wrong");
    }
  };

  return (
    <section className="relative">
      {/* hero */}
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 min-h-[68vh] flex flex-col justify-center">
        <h1 className="leading-tight font-semibold tracking-[-0.02em] mb-10 md:mb-12">
          <span className="block text-[10vw] md:text-[72px]">Orchestrate.</span>
          <span className="block text-[10vw] md:text-[72px]">
            Don’t{" "}
            <span className="bg-gradient-to-r from-[#ff7a33] via-[#ff5b1f] to-[#ff3d0c] bg-clip-text text-transparent">
              Micro-Manage.
            </span>
          </span>
        </h1>

        <div className="relative rounded-full p-[2px] ring-1 ring-[#ff6a2b]/40 shadow-[0_0_120px_rgba(255,90,0,.18)] max-w-5xl">
          <div className="flex items-center rounded-full bg-[#121212] pl-6 pr-2 py-3 md:py-4">
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Enter an instruction…"
              className="flex-1 bg-transparent outline-none placeholder-white/30 text-white text-base md:text-lg"
            />
            <button
              onClick={startRun}
              disabled={loading || !instruction.trim()}
              className="ml-3 md:ml-4 rounded-full px-5 md:px-7 py-2 md:py-2.5 text-base md:text-lg bg-gradient-to-r from-[#ff6a2b] to-[#ff3d0c] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Running…" : "Run"}
            </button>
          </div>
        </div>

        <div className="mt-6 md:mt-8 text-white/60 space-y-1 text-sm md:text-base">
          <p>e.g. Summarize this report and add to Notion</p>
          <p>e.g. Create tasks in GitHub from roadmap, Share update to Slack</p>
        </div>

        {instruction && (
          <p className="mt-4 text-[13px] text-white/40">
            Detected tools for this run:{" "}
            <span className="text-white/70">{tools.join(", ")}</span>
          </p>
        )}

        {err && <p className="mt-4 text-[#ff6440]">{err}</p>}
      </div>

      {/* timeline */}
      {run && run.steps?.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="text-xl md:text-2xl font-medium mb-6">Run timeline</h2>
          <div className="space-y-4">
            {run.steps.map((step) => (
              <StepRow key={step.id} step={step} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- UI bits ---------- */

function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-2 text-white/80">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
      </span>
      <span className="text-amber-300/90">Running…</span>
    </span>
  );
}

function SpinnerDots() {
  return (
    <span className="inline-flex items-center gap-1.5 text-white/60">
      <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.05s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce" />
    </span>
  );
}

function StepRow({ step }) {
  const isDone = step.status === "done";
  const isFail = step.status === "failed";
  const isPending = !isDone && !isFail;

  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#141414] border border-white/5 px-5 py-4">
      <div className="flex items-center gap-3">
        {isDone && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />}
        {isFail && <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />}
        {isPending && <PendingBadge />}

        <p className="text-lg">
          <span className="font-semibold mr-2">{isDone ? "Done" : isFail ? "Failed" : "…"}</span>
          {labelFor(step.tool)}
        </p>
      </div>

      <div>
        {isPending ? (
          <SpinnerDots />
        ) : (
          <a
            href={step.link || "#"}
            target="_blank"
            rel="noreferrer"
            className={`text-emerald-400/90 hover:text-emerald-300 ${
              !isDone ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Open
          </a>
        )}
      </div>
    </div>
  );
}

import PropTypes from "prop-types";
StepRow.propTypes = { step: PropTypes.object.isRequired };

function labelFor(tool) {
  switch (tool) {
    case "notion":
      return "Notion Page Created";
    case "sheets":
      return "Row Added to Google Sheet";
    case "github":
      return "GitHub Issues Created";
    case "slack":
      return "Slack Message Posted";
    case "email":
      return "Email Sent";
    case "summarizer":
      return "Document Summarized";
    default:
      return tool;
  }
}