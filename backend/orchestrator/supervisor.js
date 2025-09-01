// backend/orchestrator/supervisor.js
import { publish } from "../lib/agentBus.js";
import { TYPES, msg } from "../lib/messages.js";
import { runAgent } from "../agents/index.js";
import { patchMemory } from "../lib/memory.js";
import { saveRunMeta, saveStep, appendLog, finalizeRun } from "../lib/history.js";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function summarizerFirst(steps = []) {
  if (!Array.isArray(steps) || steps.length < 2) return steps || [];
  const i = steps.findIndex((s) => s.tool === "summarizer");
  if (i <= 0) return steps;
  const copy = steps.slice();
  const [summ] = copy.splice(i, 1);
  copy.unshift(summ);
  return copy;
}

export async function executeRun(app, runId) {
  const store = (app.locals.runs ||= {});
  const run = store[runId];
  if (!run) throw new Error("run not found");

  const maxAttempts = Math.max(1, parseInt(process.env.STEP_MAX_ATTEMPTS || "2", 10));
  const baseBackoff = Math.max(0, parseInt(process.env.STEP_BACKOFF_MS || "600", 10));
  const continueOnError = String(process.env.CONTINUE_ON_ERROR || "true") !== "false";

  run.status = "running";
  run.log ||= [];
  run.memory ||= {};
  if (Array.isArray(run.steps)) run.steps = summarizerFirst(run.steps);

  await saveRunMeta(run);

  let anyFailed = false;

  for (const step of run.steps) {
    if (step.status === "done") continue;

    step.status = "running";
    step.error = null;

    // NEW: freeze createdAt once for this step
    step.createdAt ||= Date.now();
    await saveStep(run.id, step);

    publish(runId, msg({
      runId,
      from: "supervisor",
      type: TYPES.ACTION_REQUEST,
      payload: { tool: step.tool },
    }));

    // NEW: log ACTION_REQUEST
    await appendLog(run.id, {
      from: "supervisor",
      type: "ACTION_REQUEST",
      payload: { tool: step.tool },
    });

    let attempt = 0, succeeded = false, lastErr = null;

    while (attempt < maxAttempts && !succeeded) {
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

        await saveStep(run.id, step);

        publish(runId, msg({
          runId,
          from: step.tool,
          type: TYPES.ACTION_RESULT,
          payload: { ok: true, link: step.link },
        }));

        // NEW: log successful ACTION_RESULT
        await appendLog(run.id, {
          from: step.tool,
          type: "ACTION_RESULT",
          payload: { ok: true, link: step.link },
        });

        succeeded = true;
      } catch (e) {
        lastErr = e;
        attempt += 1;

        await appendLog(run.id, {
          from: step.tool,
          type: "retry",
          payload: { attempt, message: String(e?.message || e) },
        });

        if (attempt < maxAttempts) {
          const backoff = baseBackoff * Math.pow(2, attempt - 1);
          run.log.push({ ts: Date.now(), level: "warn", tool: step.tool, attempt, msg: `retrying in ${backoff}ms due to: ${e?.message || e}` });
          await wait(backoff);
        }
      }
    }

    if (!succeeded) {
      step.status = "failed";
      step.error = String(lastErr?.message || lastErr || "Unknown error");
      anyFailed = true;
      await saveStep(run.id, step);

      publish(runId, msg({
        runId,
        from: step.tool,
        type: TYPES.ACTION_RESULT,
        payload: { ok: false, error: step.error },
      }));

      await appendLog(run.id, { from: step.tool, type: "error", payload: { message: step.error } });

      if (!continueOnError) {
        run.status = "failed";
        run.completedAt = Date.now();
        await finalizeRun(run);
        return;
      }
    }

    await saveRunMeta(run);
  }

  run.status = anyFailed ? "completed_with_errors" : "completed";
  run.completedAt = Date.now();
  await finalizeRun(run);
}