// backend/lib/llm.js
export async function callLLM({ messages }) {
  const provider = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (provider !== "groq") {
    throw new Error("LLM_PROVIDER must be 'groq' (current: " + provider + ")");
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const model = process.env.LLM_MODEL || "llama3-8b-8192";

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 30000); // 30s safety timeout

  let res;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(t);
    throw new Error("Groq request failed: " + (e?.message || e));
  } finally {
    clearTimeout(t);
  }

  if (!res.ok) {
    // Surface the full body to the step.error; super useful for debugging
    const text = await res.text().catch(() => "");
    throw new Error(`Groq error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error("Groq returned no content");
  return out;
}