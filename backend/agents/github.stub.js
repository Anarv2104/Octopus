function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function handle() {
  await sleep(600);
  return {
    ok: true,
    link: "https://github.com/your/repo/issues",
  };
}