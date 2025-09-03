// backend/agents/summarizer.js
import fetch from "node-fetch";
import path from "path";
import { extractText } from "../lib/extractText.js";
import { callLLM } from "../lib/llm.js";
import { getSignedUrl } from "../lib/storage.js";

export async function summarizerAgent({ instruction, memory }) {
  // We might have either:
  //  - memory.fileUrl: a stable proxy like http://.../files/<key> (or /uploads/... in local mode)
  //  - memory.fileKey: the raw storage key (useful to mint a fresh signed URL)
  const fileKey = memory?.fileKey || null;
  let fileUrl = memory?.fileUrl || null;

  // If no URL but we do have a key (private bucket mode), mint a signed URL now
  if (!fileUrl && fileKey) {
    try {
      fileUrl = await getSignedUrl(fileKey); // default expiry from env
    } catch {
      // ignore; we’ll proceed without document text if we can’t get it
    }
  }

  let docText = "";
  let fileExt = null;

  if (fileUrl) {
    try {
      const u = new URL(fileUrl);
      fileExt = path.extname(u.pathname).toLowerCase() || null;

      const resp = await fetch(fileUrl);
      if (!resp.ok) throw new Error(`fetch ${resp.status}`);
      const buf = Buffer.from(await resp.arrayBuffer());

      // Pass a path-like hint so extractText can infer type
      docText = await extractText(buf, u.pathname);

      console.log("[summarizer] extracted chars:", docText?.length || 0, "ext:", fileExt);
    } catch (e) {
      console.log("[summarizer] extract error:", e?.message || e);
      // continue without docText
    }
  }

  const messages = [
    {
      role: "system",
      content:
        "You are Octopus' Summarizer agent. Produce: (1) a short 'Summary:' paragraph, and (2) 'Key Points:' with 3–8 bullets. Be concrete and specific.",
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
    // Link back to the source (proxy URL or direct if local)
    link: fileUrl || "#",
    payload: {
      summary,
      extractedChars: docText?.length || 0,
      fileExt,
    },
    memoryPatch: { lastSummary: summary },
  };
}