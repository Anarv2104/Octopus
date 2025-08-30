// backend/orchestrator/supervisor.js
import { publish } from "../lib/agentBus.js";
import { TYPES, msg } from "../lib/messages.js";
import { runAgent } from "../agents/index.js";
import { patchMemory } from "../lib/memory.js";

export async function executeRun(app, runId) {
  const store = (app.locals.runs ||= {});
  const run = store[runId];
  if (!run) throw new Error("run not found");
  run.status = "running";

  // Run summarizer first if present
  if (Array.isArray(run.steps) && run.steps.length > 1) {
    run.steps.sort((a, b) => {
      const aSumm = a.tool === "summarizer";
      const bSumm = b.tool === "summarizer";
      if (aSumm && !bSumm) return -1;
      if (bSumm && !aSumm) return 1;
      return 0;
    });
  }

  let anyFailed = false;

  for (const step of run.steps) {
    step.status = "running";

    publish(runId, msg({
      runId,
      from: "supervisor",
      type: TYPES.ACTION_REQUEST,
      payload: { tool: step.tool },
    }));

    try {
      const result = await runAgent(step.tool, {
        uid: run.uid,
        instruction: run.instruction,
        memory: run.memory || {},
      });

      if (result?.memoryPatch) patchMemory(app, runId, result.memoryPatch);

      step.link = result?.link || step.link || "#";
      step.payload = result?.payload || null;
      step.error = null;
      step.status = "done";

      if (step.tool === "summarizer" && run.fileUrl) step.link = run.fileUrl;

      publish(runId, msg({
        runId,
        from: step.tool,
        type: TYPES.ACTION_RESULT,
        payload: { ok: true, link: step.link },
      }));
    } catch (e) {
      step.status = "failed";
      step.error = String(e?.message || e);
      anyFailed = true;

      publish(runId, msg({
        runId,
        from: step.tool,
        type: TYPES.ACTION_RESULT,
        payload: { ok: false, error: step.error },
      }));

      // DO NOT return; continue to next step (best-effort)
    }
  }

  run.status = anyFailed ? "completed_with_errors" : "completed";
  run.completedAt = Date.now();
}