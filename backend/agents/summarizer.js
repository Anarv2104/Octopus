// backend/agents/summarizer.js
import fs from "fs/promises";
import path from "path";
import { extractText } from "../lib/extractText.js";
import { callLLM } from "../lib/llm.js";

export async function summarizerAgent({ instruction, memory }) {
  const fileUrl = memory?.fileUrl || null;
  let docText = "";
  let fileExt = null;

  if (fileUrl) {
    try {
      const fileId = fileUrl.split("/").pop();
      const abs = path.join(process.cwd(), "uploads", fileId);
      fileExt = path.extname(abs).toLowerCase();
      const buf = await fs.readFile(abs);
      docText = await extractText(buf, abs);
      console.log("[summarizer] extracted chars:", docText?.length || 0, "ext:", fileExt);
    } catch (e) {
      console.log("[summarizer] extract error:", e?.message || e);
      // keep docText empty; we fall back below
    }
  }

  const messages = [
    {
      role: "system",
      content:
        "You are Octopus' Summarizer agent. Produce: (1) a short 'Summary:' paragraph, and (2) 'Key Points:' with 3-8 bullets. Be concrete and specific.",
    },
    {
      role: "user",
      content:
        `Instruction: ${instruction || "(none)"}\n\n` +
        (docText
          ? `Document (truncated):\n${docText.slice(0, 8000)}`
          : fileUrl
            ? `A file is attached but no selectable text could be extracted (possibly scanned/image-only). If so, summarize based on instruction/context and clearly note that the document text was not available.`
            : `No document attached.`),
    },
  ];

  const summary = await callLLM({ messages });

  return {
    link: fileUrl || "#",
    payload: {
      summary,
      extractedChars: docText?.length || 0,
      fileExt,
    },
    memoryPatch: { lastSummary: summary },
  };
}