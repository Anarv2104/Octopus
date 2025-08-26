// backend/lib/extractText.js
import path from "path";
import { spawn } from "child_process";

// Lazy ESM loaders (so server boots even if optional deps absent)
let pdfjs = null;
let mammothMod = null;

async function loadPdfJs() {
  if (!pdfjs) {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjs;
}

async function loadMammoth() {
  if (!mammothMod) {
    const mod = await import("mammoth");
    mammothMod = mod.default || mod;
  }
  return mammothMod;
}

const cap = (s, n = 20000) => (s || "").slice(0, n);

/** Try Poppler's pdftotext via stdin/stdout. Returns "" if unavailable/fails. */
function pdfToTextWithPoppler(buffer) {
  return new Promise((resolve) => {
    try {
      const p = spawn("pdftotext", ["-layout", "-q", "-", "-"]); // read stdin → write stdout
      let out = "";
      let err = "";

      p.stdout.on("data", (d) => (out += d.toString("utf8")));
      p.stderr.on("data", (d) => (err += d.toString("utf8")));
      p.on("error", () => resolve("")); // command not found, permission, etc.
      p.on("close", () => resolve(out || "")); // return whatever we got

      p.stdin.write(buffer);
      p.stdin.end();
    } catch {
      resolve("");
    }
  });
}

/** Fallback: pdfjs-dist (no worker in Node) */
async function pdfToTextWithPdfjs(buffer) {
  try {
    const { getDocument } = await loadPdfJs();
    const loadingTask = getDocument({
      data: buffer,
      disableWorker: true,
      isEvalSupported: false,
    });
    const pdf = await loadingTask.promise;

    let combined = "";
    const MAX_PAGES = Math.min(pdf.numPages, 10);
    for (let i = 1; i <= MAX_PAGES; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items?.map((it) => it.str).filter(Boolean) || [];
      combined += strings.join(" ") + "\n";
    }
    return combined;
  } catch {
    return "";
  }
}

export async function extractText(buffer, filePath) {
  const lower = (filePath || "").toLowerCase();
  const ext = path.extname(lower);

  // Plain text-ish
  if (/\.(txt|md|csv|json)$/.test(lower)) {
    try {
      return cap(buffer.toString("utf8"));
    } catch {
      return "";
    }
  }

  // DOCX
  if (lower.endsWith(".docx")) {
    try {
      const mammoth = await loadMammoth();
      const { value } = await mammoth.extractRawText({ buffer });
      return cap(value);
    } catch {
      return "";
    }
  }

  // PDF
  if (lower.endsWith(".pdf")) {
    // 1) Poppler (best)
    const popplerText = await pdfToTextWithPoppler(buffer);
    if (popplerText?.trim()) return cap(popplerText);

    // 2) pdfjs-dist fallback
    const pdfjsText = await pdfToTextWithPdfjs(buffer);
    if (pdfjsText?.trim()) return cap(pdfjsText);

    // 3) last resort
    return "";
  }

  // Unknown types → try utf8
  try {
    return cap(buffer.toString("utf8"));
  } catch {
    return "";
  }
}