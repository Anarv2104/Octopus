function ensureRun(app, runId) {
  const store = (app.locals.runs ||= {});
  const run = store[runId];
  if (!run) throw new Error("run not found");
  if (!run.memory) run.memory = {};
  return run;
}

export function getMemory(app, runId) {
  return ensureRun(app, runId).memory;
}

export function patchMemory(app, runId, patch) {
  const run = ensureRun(app, runId);
  Object.assign(run.memory, patch || {});
  return run.memory;
}