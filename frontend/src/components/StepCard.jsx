import PropTypes from "prop-types";

const statusMeta = {
  pending: { dot: "bg-neutral-500/60", label: "pending", text: "text-neutral-400" },
  running: { dot: "bg-orange-500", label: "running", text: "text-orange-300" },
  done:    { dot: "bg-emerald-500", label: "done",    text: "text-emerald-400" },
  failed:  { dot: "bg-red-500",     label: "failed",  text: "text-red-400" },
};

const niceName = {
  notion: "Notion Page Created",
  sheets: "Row Added to Google Sheet",
  github: "GitHub Issues Created",
  slack:  "Slack Message Posted",
  email:  "Email Sent",
  summarizer: "Document Summarized",
};

export default function StepCard({ step }) {
  const meta = statusMeta[step.status] || statusMeta.pending;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
        <div className="text-lg">
          <span className="text-white/90 font-medium">{
            step.status === "done" ? "Done" :
            step.status === "failed" ? "Failed" : "…"
          }</span>
          <span className="text-white/70 ml-3">
            {niceName[step.tool] || step.tool}
          </span>
          {step.error && <span className="ml-3 text-red-400 text-sm">({step.error})</span>}
        </div>
      </div>

      <div className="text-right">
        {step.status === "done" && step.link ? (
          <a
            href={step.link}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:text-emerald-300 transition"
          >
            Open
          </a>
        ) : (
          <span className={`text-sm ${meta.text}`}>{meta.label}</span>
        )}
      </div>
    </div>
  );
}

StepCard.propTypes = {
  step: PropTypes.shape({
    tool: PropTypes.string.isRequired,
    status: PropTypes.oneOf(["pending", "running", "done", "failed"]).isRequired,
    link: PropTypes.string,
    error: PropTypes.string,
  }).isRequired,
};