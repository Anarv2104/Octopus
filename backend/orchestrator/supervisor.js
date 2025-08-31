// backend/orchestrator/supervisor.js
import { publish } from "../lib/agentBus.js";
import { TYPES, msg } from "../lib/messages.js";
import { runAgent } from "../agents/index.js";
import { patchMemory } from "../lib/memory.js";

/** tiny sleep helper */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** keep summarizer first if present; leave other order intact */
function summarizerFirst(steps = []) {
  if (!Array.isArray(steps) || steps.length < 2) return steps || [];
  const i = steps.findIndex((s) => s.tool === "summarizer");
  if (i <= 0) return steps; // either not found or already first
  const copy = steps.slice();
  const [summ] = copy.splice(i, 1);
  copy.unshift(summ);
  return copy;
}

export async function executeRun(app, runId) {
  const store = (app.locals.runs ||= {});
  const run = store[runId];
  if (!run) throw new Error("run not found");

  // config knobs (env, optional)
  const maxAttempts = Math.max(1, parseInt(process.env.STEP_MAX_ATTEMPTS || "2", 10));
  const baseBackoff = Math.max(0, parseInt(process.env.STEP_BACKOFF_MS || "600", 10));
  const continueOnError = String(process.env.CONTINUE_ON_ERROR || "true") !== "false";

  run.status = "running";
  run.log ||= [];
  run.memory ||= {};

  // preserve your intended behavior: summarizer goes first
  if (Array.isArray(run.steps)) run.steps = summarizerFirst(run.steps);

  let anyFailed = false;

  for (const step of run.steps) {
    // if step already done (in case of re-run), skip
    if (step.status === "done") continue;

    step.status = "running";
    step.error = null;

    // one ACTION_REQUEST per step (same as your previous behavior)
    publish(
      runId,
      msg({
        runId,
        from: "supervisor",
        type: TYPES.ACTION_REQUEST,
        payload: { tool: step.tool },
      })
    );

    let attempt = 0;
    let succeeded = false;
    let lastErr = null;

    // retry loop
    while (attempt < maxAttempts && !succeeded) {
      try {
        const result = await runAgent(step.tool, {
          uid: run.uid,
          instruction: run.instruction,
          memory: run.memory || {},
        });

        // memory handoff (your existing helper)
        if (result?.memoryPatch) {
          patchMemory(app, runId, result.memoryPatch);
        }

        // finalize step on success
        step.link = result?.link || step.link || "#";
        step.payload = result?.payload || null;
        step.error = null;
        step.status = "done";

        // your previous special case: if summarizer & we had a file, show file link
        if (step.tool === "summarizer" && run.fileUrl) {
          step.link = run.fileUrl;
        }

        // ACTION_RESULT (ok: true)
        publish(
          runId,
          msg({
            runId,
            from: step.tool,
            type: TYPES.ACTION_RESULT,
            payload: { ok: true, link: step.link },
          })
        );

        succeeded = true;
      } catch (e) {
        lastErr = e;
        attempt += 1;

        // if we still have attempts left, wait with exponential backoff then retry
        if (attempt < maxAttempts) {
          const backoff = baseBackoff * Math.pow(2, attempt - 1);
          run.log.push({
            ts: Date.now(),
            level: "warn",
            tool: step.tool,
            attempt,
            msg: `retrying in ${backoff}ms due to: ${e?.message || e}`,
          });
          await wait(backoff);
        }
      }
    }

    // After retries, if not succeeded, mark failed
    if (!succeeded) {
      step.status = "failed";
      step.error = String(lastErr?.message || lastErr || "Unknown error");
      anyFailed = true;

      // ACTION_RESULT (ok: false)
      publish(
        runId,
        msg({
          runId,
          from: step.tool,
          type: TYPES.ACTION_RESULT,
          payload: { ok: false, error: step.error },
        })
      );

      // log failure
      run.log.push({
        ts: Date.now(),
        level: "error",
        tool: step.tool,
        msg: step.error,
      });

      // optionally stop the whole pipeline
      if (!continueOnError) {
        run.status = "failed";
        run.completedAt = Date.now();
        return;
      }

      // else continue to next step
    }
  }

  // overall status (mirror your previous semantics)
  run.status = anyFailed ? "completed_with_errors" : "completed";
  run.completedAt = Date.now();
}