// backend/agents/summarizer.js
import fs from "fs/promises";
import path from "path";
import { extractText } from "../lib/extractText.js";
import { callLLM } from "../lib/llm.js";

export async function summarizerAgent({ instruction, memory }) {
  const fileUrl = memory?.fileUrl || null;
  let docText = "";

  if (fileUrl) {
    try {
      const fileId = fileUrl.split("/").pop();
      const abs = path.join(process.cwd(), "uploads", fileId);
      const buf = await fs.readFile(abs);
      docText = await extractText(buf, abs);
    } catch {
      // ignore; we'll just summarize instruction/context
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
            ? `A file is attached, but its text could not be extracted. Summarize based on instruction/context.`
            : `No document attached.`),
    },
  ];

  const summary = await callLLM({ messages });

  return {
    link: fileUrl || "#",
    payload: { summary },
    memoryPatch: { lastSummary: summary },
  };
}