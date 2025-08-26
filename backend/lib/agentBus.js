let appRef = null;
const subs = new Map(); // runId -> [handlers]

export function initBus(app) {
  appRef = app;
}

export function publish(runId, message) {
  if (!appRef) throw new Error("initBus(app) first");
  const store = (appRef.locals.runs ||= {});
  const run = store[runId];
  if (!run) return;

  (run.log ||= []).push(message); // append to run log

  const handlers = subs.get(runId) || [];
  for (const h of handlers) {
    try { h(message); } catch {}
  }
}

export function subscribe(runId, handler) {
  const list = subs.get(runId) || [];
  list.push(handler);
  subs.set(runId, list);
  return () => {
    const cur = subs.get(runId) || [];
    subs.set(runId, cur.filter((h) => h !== handler));
  };
}