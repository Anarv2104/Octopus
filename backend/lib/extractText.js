// backend/lib/extractText.js
import path from "path";

// Lazy-import heavy parsers so the server can start even if not installed yet
let pdfParse = null;
let mammoth = null;

async function loadPdfParse() {
  if (!pdfParse) {
    ({ default: pdfParse } = await import("pdf-parse")); // ESM default
  }
  return pdfParse;
}

async function loadMammoth() {
  if (!mammoth) {
    ({ default: mammoth } = await import("mammoth")); // ESM default
  }
  return mammoth;
}

export async function extractText(buffer, filePath) {
  const lower = (filePath || "").toLowerCase();

  // Plain text-ish
  if (/\.(txt|md|csv|json)$/.test(lower)) {
    try {
      return buffer.toString("utf8").slice(0, 20000);
    } catch {
      return "";
    }
  }

  // PDF
  if (lower.endsWith(".pdf")) {
    try {
      const parse = await loadPdfParse();
      const { text } = await parse(buffer);
      return (text || "").slice(0, 20000);
    } catch {
      return "";
    }
  }

  // DOCX
  if (lower.endsWith(".docx")) {
    try {
      const m = await loadMammoth();
      const { value } = await m.extractRawText({ buffer });
      return (value || "").slice(0, 20000);
    } catch {
      return "";
    }
  }

  // Fallback (unknown type)
  try {
    return buffer.toString("utf8").slice(0, 20000);
  } catch {
    return "";
  }
}