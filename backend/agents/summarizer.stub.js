// backend/agents/summarizer.stub.js
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function handle({ instruction }) {
  await sleep(600);
  const summary = `Summary: ${String(instruction).slice(0, 120)}...`;
  return {
    ok: true,
    summary,
    link: "https://octopus.example/summaries/demo",
    memoryPatch: { lastSummary: summary },
  };
}