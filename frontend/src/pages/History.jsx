// frontend/src/pages/History.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHistory } from "../lib/api";
import { ChevronDown, ChevronRight, ExternalLink, History as HistoryIcon, ArrowLeft } from "lucide-react";

function pill(status) {
  const map = {
    running: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    completed_with_errors: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${map[status] || "bg-white/10 text-white/70 border-white/10"}`;
}

export default function History() {
  const { idToken } = useAuth();
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState({});

  useEffect(() => {
    (async () => {
      try {
        // backend returns { runs: [...] }
        const { runs } = await getHistory(idToken);
        setItems(runs || []);
      } catch (e) {
        setErr(e?.message || "Failed to load history");
      }
    })();
  }, [idToken]);

  return (
    <section className="max-w-6xl mx-auto px-6 py-12 relative">
      {/* floating Back button (mirrors Dashboard's History chip) */}
      <div className="fixed right-5 top-20 z-30">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#121212] px-3 py-1.5 text-sm hover:bg-white/5"
          title="Back to Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-white/70" /> History
        </h1>
      </div>

      {err && <p className="text-rose-400 mb-4">{err}</p>}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#0f0f0f] text-white/60 text-sm">
          <div className="col-span-5">Instruction</div>
          <div className="col-span-3">Tools</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {items.map((r) => {
          const created = r.createdAt ? new Date(r.createdAt).toLocaleString() : "—";
          const isOpen = !!open[r.id];
          const toolList = Array.isArray(r.steps) ? r.steps.map((s) => s.tool).join(", ") : "—";
          return (
            <div key={r.id} className="border-t border-white/10">
              <button
                className="w-full grid grid-cols-12 gap-4 px-4 py-4 hover:bg-white/[0.03] text-left"
                onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}
              >
                <div className="col-span-5 flex items-start gap-2">
                  {isOpen ? <ChevronDown className="h-4 w-4 mt-1 text-white/40" /> : <ChevronRight className="h-4 w-4 mt-1 text-white/40" />}
                  <span className="truncate">{r.instruction}</span>
                </div>
                <div className="col-span-3 text-white/70 truncate">{toolList}</div>
                <div className="col-span-2 text-white/60">{created}</div>
                <div className="col-span-2 text-right">
                  <span className={pill(r.status)}>{r.status.replaceAll("_", " ")}</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-5">
                  {Array.isArray(r.steps) && r.steps.length ? (
                    <div className="space-y-2">
                      {r.steps.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-xl bg-[#141414] border border-white/10 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${
                              s.status === "done" ? "bg-emerald-400" :
                              s.status === "failed" ? "bg-rose-500" : "bg-amber-400"
                            }`} />
                            <span className="text-white/80">{labelFor(s.tool)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {s.error && <span className="text-rose-300 text-sm truncate max-w-[40ch]">{s.error}</span>}
                            {s.link && (
                              <a href={s.link} target="_blank" rel="noreferrer" className="text-emerald-300 text-sm inline-flex items-center gap-1">
                                Open <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/50 text-sm">No step details stored yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function labelFor(tool) {
  switch (tool) {
    case "notion": return "Notion Page Created";
    case "sheets": return "Row Added to Google Sheet";
    case "github": return "GitHub Issues Created";
    case "slack": return "Slack Message Posted";
    case "email": return "Email Sent";
    case "summarizer": return "Document Summarized";
    default: return tool;
  }
}