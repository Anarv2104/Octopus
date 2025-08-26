export const TYPES = {
  ACTION_REQUEST: "action_request",
  ACTION_RESULT: "action_result",
  INFO: "info",
  ERROR: "error",
};

export function msg({ runId, from, type, payload }) {
  return { runId, from, type, payload, ts: Date.now() };
}