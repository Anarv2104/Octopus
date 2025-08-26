function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function handle({ memory }) {
  await sleep(600);
  return {
    ok: true,
    link: "https://www.notion.so/your-demo-page",
  };
}