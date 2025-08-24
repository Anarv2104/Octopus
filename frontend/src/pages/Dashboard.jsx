import { useState, useEffect } from "react";
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

  // live-plan tools from the text
  useEffect(() => {
    setTools(planTools(instruction));
  }, [instruction]);

  const startRun = async () => {
    setErr("");
    if (!instruction.trim()) return;

    try {
      setLoading(true);
      const { id } = await createRun(idToken, { instruction, tools });
      setRunId(id);

      // start execution (fire and then poll)
      await executeRun(idToken, id);

      // poll once after a small delay (demo)
      setTimeout(async () => {
        const r = await getRun(idToken, id);
        setRun(r);
        setLoading(false);
      }, 900);
    } catch (e) {
      setLoading(false);
      setErr(e.message || "Something went wrong");
    }
  };

  return (
    <section className="relative">
      {/* hero block fills view when idle, grows when results show */}
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 min-h-[68vh] flex flex-col justify-center">
        {/* Headline */}
        <h1 className="leading-tight font-semibold tracking-[-0.02em] mb-10 md:mb-12">
          <span className="block text-[10vw] md:text-[72px]">Orchestrate.</span>
          <span className="block text-[10vw] md:text-[72px]">
            Don’t{" "}
            <span className="bg-gradient-to-r from-[#ff7a33] via-[#ff5b1f] to-[#ff3d0c] bg-clip-text text-transparent">
              Micro-Manage.
            </span>
          </span>
        </h1>

        {/* Input pill with glow + Run */}
        <div className="
            relative rounded-full p-[2px]
            ring-1 ring-[#ff6a2b]/40
            shadow-[0_0_120px_rgba(255,90,0,.18)]
            max-w-5xl
          ">
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
              className="
                ml-3 md:ml-4 rounded-full px-5 md:px-7 py-2 md:py-2.5 text-base md:text-lg
                bg-gradient-to-r from-[#ff6a2b] to-[#ff3d0c]
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {loading ? "Running…" : "Run"}
            </button>
          </div>
        </div>

        {/* “e.g.” helper lines */}
        <div className="mt-6 md:mt-8 text-white/60 space-y-1 text-sm md:text-base">
          <p>e.g. Summarize this report and add to Notion</p>
          <p>e.g. Create tasks in GitHub from roadmap, Share update to Slack</p>
        </div>

        {/* (optional) live tool detection line */}
        {instruction && (
          <p className="mt-4 text-[13px] text-white/40">
            Detected tools for this run:{" "}
            <span className="text-white/70">{tools.join(", ")}</span>
          </p>
        )}

        {/* error */}
        {err && <p className="mt-4 text-[#ff6440]">{err}</p>}
      </div>

      {/* TIMELINE — render only after we actually have a run */}
      {run && run.steps?.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="text-xl md:text-2xl font-medium mb-6">Run timeline</h2>

          <div className="space-y-4">
            {run.steps.map((step) => (
              <div
                key={step.id}
                className="
                  flex items-center justify-between
                  rounded-2xl bg-[#141414] border border-white/5
                  px-5 py-4
                "
              >
                <div className="flex items-center gap-3">
                  {/* status dot */}
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      step.status === "done" ? "bg-emerald-400" : "bg-white/30"
                    }`}
                  />
                  <p className="text-lg">
                    <span className="font-semibold mr-2">
                      {step.status === "done" ? "Done" : "…"}
                    </span>
                    {labelFor(step.tool)}
                  </p>
                </div>

                <a
                  href={step.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={`text-emerald-400/90 hover:text-emerald-300 ${
                    step.status !== "done" ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Open
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// friendly labels for the timeline
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