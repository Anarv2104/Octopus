// frontend/src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Paperclip, X, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { planTools } from "../lib/planner";
import { createRun, getRun, executeRun, uploadFile } from "../lib/api";

export default function Dashboard() {
  const { idToken } = useAuth();

  // instruction + tools
  const [instruction, setInstruction] = useState("");
  const [tools, setTools] = useState([]);

  // run state
  const [runId, setRunId] = useState(null);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // file state
  const [fileMeta, setFileMeta] = useState(null); // { fileId, url, originalName, size, mimetype }
  const [uploading, setUploading] = useState(false);

  // summary modal state (optional nicety)
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");

  // ui helpers
  const pollTimer = useRef(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // derive tools from instruction + whether a file is attached
  useEffect(() => {
    setTools(planTools(instruction, !!fileMeta));
  }, [instruction, fileMeta]);

  const allDone = (r) => r?.steps?.every((s) => s.status === "done" || s.status === "failed");

  // continuous polling while a run is active
  useEffect(() => {
    if (!runId || !idToken) return;
    let aborted = false;

    async function tick() {
      try {
        const r = await getRun(idToken, runId);
        if (aborted) return;
        setRun(r);
        if (!allDone(r)) {
          pollTimer.current = setTimeout(tick, 900);
        } else {
          setLoading(false);
        }
      } catch {
        if (aborted) return;
        pollTimer.current = setTimeout(tick, 1200);
      }
    }

    tick();
    return () => {
      aborted = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [runId, idToken]);

  /* ---------------- File upload ---------------- */

  const openFilePicker = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !idToken) return;

    try {
      setUploading(true);
      setErr("");
      const meta = await uploadFile(idToken, f);
      setFileMeta(meta); // { fileId, url, originalName, size, mimetype }
    } catch (error) {
      setErr(error?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset so same file can be re-picked
    }
  };

  const removeFile = () => setFileMeta(null);

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!e.dataTransfer.files?.length) return;
    const f = e.dataTransfer.files[0];
    // simulate file input selection
    const dt = new DataTransfer();
    dt.items.add(f);
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      await onFileChange({ target: fileInputRef.current });
    }
  };

  /* ---------------- Run flow ---------------- */

  const startRun = async () => {
    setErr("");
    if (!instruction.trim()) return;
    if (uploading) return;

    try {
      setLoading(true);
      setRun(null);
      setRunId(null);

      const payload = {
        instruction,
        tools,
        ...(fileMeta?.fileId ? { fileId: fileMeta.fileId } : {}),
      };

      const { id } = await createRun(idToken, payload);
      setRunId(id);

      // fire-and-forget; poller will pick it up
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

        {/* pill input */}
        <div
          className={`relative rounded-full p-[2px] ring-1 ring-[#ff6a2b]/40 shadow-[0_0_120px_rgba(255,90,0,.18)] max-w-5xl
            ${dragOver ? "ring-2 ring-orange-400/80 shadow-[0_0_160px_rgba(255,120,50,.25)]" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="flex items-center rounded-full bg-[#121212] pl-6 pr-2 py-3 md:py-4">
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Enter an instruction…"
              className="flex-1 bg-transparent outline-none placeholder-white/30 text-white text-base md:text-lg"
            />

            {/* Attach icon button */}
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading || loading}
              title="Attach a file"
              className="mr-2 rounded-full p-2 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white/70" />
              ) : (
                <Paperclip className="h-5 w-5 text-white/70" />
              )}
            </button>

            {/* Run */}
            <button
              onClick={startRun}
              disabled={loading || uploading || !instruction.trim()}
              className="rounded-full px-5 md:px-7 py-2 md:py-2.5 text-base md:text-lg
                         bg-gradient-to-r from-[#ff6a2b] to-[#ff3d0c]
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Running…" : "Run"}
            </button>

            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,.csv,.json,.ppt,.pptx,image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        </div>

        {/* file chip */}
        {fileMeta && (
          <div className="mt-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/70 px-3 py-1.5">
              <span className="text-white/80 text-sm truncate max-w-[60vw] md:max-w-[420px]">
                {fileMeta.originalName}{" "}
                <span className="text-white/40">
                  ({prettySize(fileMeta.size)})
                </span>
              </span>
              <button
                onClick={removeFile}
                className="h-6 w-6 grid place-items-center rounded-full hover:bg-white/10"
                title="Remove file"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
          </div>
        )}

        {/* helper lines */}
        <div className="mt-6 md:mt-8 text-white/60 space-y-1 text-sm md:text-base">
          <p>e.g. Summarize this report (attach PDF) and add to Notion</p>
          <p>e.g. Create tasks in GitHub from roadmap, share update to Slack</p>
        </div>

        {/* tool preview */}
        {instruction && (
          <p className="mt-4 text-[13px] text-white/40">
            Detected tools for this run:{" "}
            <span className="text-white/70">{tools.join(", ")}</span>
          </p>
        )}

        {/* errors */}
        {err && <p className="mt-4 text-[#ff6440]">{err}</p>}
      </div>

      {/* timeline */}
      {run && run.steps?.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="text-xl md:text-2xl font-medium mb-6">Run timeline</h2>
          <div className="space-y-4">
            {run.steps.map((step) => (
              <StepRow
                key={step.id}
                step={step}
                onShowSummary={(text) => {
                  setSummaryText(text);
                  setSummaryOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Summary modal */}
      {summaryOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111111]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <h3 className="text-lg font-medium">Summary</h3>
              <button
                onClick={() => setSummaryOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-auto whitespace-pre-wrap text-white/80">
              {summaryText}
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSummaryOpen(false)}
                className="rounded-md px-4 py-2 border border-white/10 hover:bg-white/10"
              >
                Close
              </button>
            </div>
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

function StepRow({ step, onShowSummary }) {
  const isDone = step.status === "done";
  const isFail = step.status === "failed";
  const isPending = !isDone && !isFail;
  const hasSummary = !!step?.payload?.summary;

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

      <div className="flex items-center gap-3">
        {isDone && hasSummary && (
          <button
            onClick={() => onShowSummary(step.payload.summary)}
            className="text-sm rounded-md border border-white/10 px-3 py-1 hover:bg-white/5"
          >
            View summary
          </button>
        )}

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
StepRow.propTypes = {
  step: PropTypes.object.isRequired,
  onShowSummary: PropTypes.func,
};

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

function prettySize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}