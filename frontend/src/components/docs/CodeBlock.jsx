// src/components/docs/CodeBlock.jsx
import { useState } from "react";
import PropTypes from "prop-types";

export default function CodeBlock({ title, code, lang = "bash" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="text-sm text-white/70">{title}</div>
        <button
          onClick={copy}
          className="text-xs px-2 py-1 rounded-md border border-neutral-700 hover:border-neutral-600"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-sm leading-relaxed overflow-x-auto">
        <code className={`language-${lang}`}>{code}</code>
      </pre>
    </div>
  );
}

CodeBlock.propTypes = {
  title: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  lang: PropTypes.string,
};