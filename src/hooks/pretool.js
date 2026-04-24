#!/usr/bin/env node
/**
 * PreToolUse hook (v0.6.0 Stage 4 + Round-6 review fixes + Round-11
 * shared-helper refactor).
 *
 * Extracts tool_name + tool_input from CC's hook input, asks the Hermes
 * IPC server to classify the call, and translates the response into the
 * permissionDecision shape CC expects.
 *
 * Fail-closed (design invariant #3). Every exit path writes a
 * permissionDecision; we never allow silently. Belt-and-braces:
 *
 *   1. Per-step try/catch inside main()
 *   2. installHookDeadline() — wall-clock timer + idempotent
 *      emitAndExit. If readStdinJson hangs (CC writes nothing and
 *      never closes stdin), the deadline fires a deny before CC's
 *      300s hook timeout — whose default behaviour is undocumented.
 *   3. main.catch(crashHandler) — last-resort deny if the body
 *      throws past our per-step catches.
 *
 * Exit code convention:
 *   0 → JSON on stdout is authoritative
 *   2 → blocking error; stderr is shown to Claude
 *   other → non-blocking error; stderr logged to CC transcript
 */

const {
  readStdinJson,
  sendToHermes,
  traceHook,
  installHookDeadline,
} = require("./common/ipc-client");

// Wall-clock budget for the whole hook. CC's configured PreToolUse
// timeout is 300s; we leave a 15s gap so our own deny lands before CC
// reacts to its timeout.
const OVERALL_DEADLINE_MS = 285_000;

// Shorter than OVERALL_DEADLINE_MS so if the IPC call hangs, main()'s
// `sendToHermes` catch produces a clean deny before the deadline timer
// fires (nicer error message).
const IPC_TIMEOUT_MS = 270_000;

/** Build the PermissionDecision payload CC expects. */
function buildDecision(decision, reason) {
  return {
    hookSpecificOutput: Object.assign(
      {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
      },
      reason ? { permissionDecisionReason: reason } : {},
    ),
  };
}

const { emitAndExit, crashHandler } = installHookDeadline({
  deadlineMs: OVERALL_DEADLINE_MS,
  onTimeoutPayload: buildDecision(
    "deny",
    `Hermes security check timed out after ${OVERALL_DEADLINE_MS / 1000}s ` +
    `and fell back to deny. The plugin may be unloaded or unresponsive — ` +
    `reload Hermes and retry.`,
  ),
  onCrashPayload: buildDecision("deny", "Hermes security check crashed."),
});

async function main() {
  let input = null;
  try {
    input = await readStdinJson();
  } catch (_) {
    await emitAndExit(buildDecision(
      "deny",
      "Hermes security check could not parse the request from Claude Code.",
    ));
    return;
  }
  traceHook("PreToolUse", input);

  const toolName = input && input.tool_name;
  const toolInput = input && input.tool_input;
  if (typeof toolName !== "string" || !toolInput || typeof toolInput !== "object") {
    // Nothing to classify — allow. CC's own (if any) checks still run.
    await emitAndExit(buildDecision("allow"));
    return;
  }

  let result;
  try {
    result = await sendToHermes({
      req: "classify",
      tool: toolName,
      input: toolInput,
      permissionMode: input.permission_mode || null,
      cwd: input.cwd || null,
      sessionId: input.session_id || null,
    }, { timeoutMs: IPC_TIMEOUT_MS });
  } catch (e) {
    await emitAndExit(buildDecision(
      "deny",
      `Hermes could not reach the plugin to approve this ${toolName} call ` +
      `(${(e && e.message) || e}). Try again once Hermes is loaded, or ` +
      `turn off "Interactive CLI protection" in Hermes settings to fall back.`,
    ));
    return;
  }

  // Round-6 F4: IPC server emits `{resp:"error", error:"..."}` when a
  // handler throws. Surface that error so the user can diagnose.
  if (result && (result.resp === "error" || typeof result.error === "string")) {
    await emitAndExit(buildDecision(
      "deny",
      `Hermes classify request errored: ${result.error || "(no detail)"}. ` +
      `Check Obsidian's Developer Tools console for plugin logs.`,
    ));
    return;
  }

  const decision = result && result.decision === "allow" ? "allow" : "deny";
  await emitAndExit(buildDecision(decision, result && result.reason ? result.reason : null));
}

main().catch(crashHandler);
