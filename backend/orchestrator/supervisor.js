import { publish } from "../lib/agentBus.js";
import { TYPES, msg } from "../lib/messages.js";
import { runAgent } from "../agents/index.js";
import { patchMemory } from "../lib/memory.js";

export async function executeRun(app, runId) {
  const store = (app.locals.runs ||= {});
  const run = store[runId];
  if (!run) throw new Error("run not found");

  run.status = "running";

  for (const step of run.steps) {
    step.status = "running";
    publish(runId, msg({
      runId, from: "supervisor", type: TYPES.ACTION_REQUEST,
      payload: { tool: step.tool }
    }));

    try {
      const result = await runAgent(step.tool, {
        instruction: run.instruction,
        memory: run.memory || {},
      });

      if (result?.memoryPatch) patchMemory(app, runId, result.memoryPatch);

      step.status = "done";
      step.link = result?.link || step.link || "#";
      step.error = null;

      publish(runId, msg({
        runId, from: step.tool, type: TYPES.ACTION_RESULT,
        payload: { ok: true, link: step.link }
      }));
    } catch (e) {
      step.status = "failed";
      step.error = String(e?.message || e);
      publish(runId, msg({
        runId, from: step.tool, type: TYPES.ACTION_RESULT,
        payload: { ok: false, error: step.error }
      }));
      run.status = "failed";
      return;
    }
  }

  run.status = "completed";
}