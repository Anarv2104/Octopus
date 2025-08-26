// backend/lib/llm.js
// Groq (free tier) — OpenAI-compatible endpoint. Uses global fetch (Node 18+).
export async function callLLM({ messages }) {
  const provider = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (provider !== "groq") {
    throw new Error("LLM_PROVIDER must be 'groq' for this setup.");
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");
  const model = process.env.LLM_MODEL || "llama-3.1-8b-instruct";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Groq error ${res.status}: ${t}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}