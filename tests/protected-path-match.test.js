/**
 * matchProtectedPath tests — v0.9.2 case-insensitive regression.
 *
 * Background: adversarial review (F2) flagged that the earlier
 * case-sensitive comparison let an attacker bypass the protected-path
 * check on Windows/macOS (case-insensitive filesystems) by varying
 * case in the tool_use's file_path:
 *
 *    file_path: ".Obsidian/plugins/hermes/data.json"
 *
 * resolved to the same file on disk, but `startsWith(
 * ".obsidian/plugins/hermes/")` returned false because of the capital O.
 * Fix lowercased both sides in matchProtectedPath. These tests pin that
 * invariant in so a future "optimization" can't silently reintroduce
 * the bypass.
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const { matchProtectedPath } = require("../src/providers/anthropic-api/tools/path-utils");

const PROTECTED = [
  ".obsidian/plugins/hermes/",
  ".obsidian/app.json",
  ".git/config",
  ".claude/",
  "Journal/",
];

// ── Case-insensitive match (F2 regression) ────────────────────────

test("F2: capitalized top-level segment still matches", () => {
  // The exact bypass from the adversarial review.
  assert.equal(
    matchProtectedPath(".Obsidian/plugins/hermes/data.json", PROTECTED),
    ".obsidian/plugins/hermes/",
  );
});

test("F2: all-caps path matches lowercase pattern", () => {
  assert.equal(
    matchProtectedPath(".OBSIDIAN/PLUGINS/HERMES/main.js", PROTECTED),
    ".obsidian/plugins/hermes/",
  );
});

test("F2: mixed case in exact-file pattern still matches", () => {
  assert.equal(
    matchProtectedPath(".Obsidian/App.json", PROTECTED),
    ".obsidian/app.json",
  );
});

test("F2: case-varied custom content folder still matches", () => {
  // User added "Journal/" as a protected content folder; attacker
  // tries "JOURNAL/private.md" to sneak past.
  assert.equal(
    matchProtectedPath("JOURNAL/private.md", PROTECTED),
    "Journal/",
  );
});

test("F2: case-varied Windows-style backslash path matches", () => {
  // Tool might pass a Windows-native path with backslashes AND case
  // variation. Both normalizations must apply.
  assert.equal(
    matchProtectedPath(".Obsidian\\plugins\\hermes\\data.json", PROTECTED),
    ".obsidian/plugins/hermes/",
  );
});

// ── Existing invariants (no regression) ──────────────────────────

test("prefix match works for directory patterns (trailing /)", () => {
  assert.equal(
    matchProtectedPath(".obsidian/plugins/hermes/main.js", PROTECTED),
    ".obsidian/plugins/hermes/",
  );
});

test("directory pattern also matches the bare-folder path", () => {
  assert.equal(
    matchProtectedPath(".obsidian/plugins/hermes", PROTECTED),
    ".obsidian/plugins/hermes/",
  );
});

test("exact match for file patterns (no trailing /)", () => {
  assert.equal(
    matchProtectedPath(".obsidian/app.json", PROTECTED),
    ".obsidian/app.json",
  );
});

test("exact-file pattern does not match unrelated sibling", () => {
  assert.equal(
    matchProtectedPath(".obsidian/appearance.json", PROTECTED),
    null,
  );
});

test("unprotected path returns null", () => {
  assert.equal(
    matchProtectedPath("notes/daily/2024-01-01.md", PROTECTED),
    null,
  );
});

test("forward-slash normalization from backslash-style input", () => {
  assert.equal(
    matchProtectedPath(".git\\config", PROTECTED),
    ".git/config",
  );
});

test("comment entries (leading #) are skipped", () => {
  // The function allows `#`-prefixed lines as comments so a user's
  // newline-delimited setting can annotate entries. Confirm the
  // comment is skipped and a real entry below it still matches.
  const patterns = [".obsidian/", "# this is a comment", "notes/secret.md"];
  assert.equal(
    matchProtectedPath("notes/secret.md", patterns),
    "notes/secret.md",
  );
});

test("accepts both string and object patterns (DEFAULT_PROTECTED_PATHS shape)", () => {
  const patterns = [
    { pattern: ".obsidian/plugins/hermes/", category: "modifies-hermes" },
    ".git/config",
  ];
  assert.equal(
    matchProtectedPath(".obsidian/plugins/hermes/main.js", patterns),
    ".obsidian/plugins/hermes/",
  );
});

test("empty/missing input returns null safely", () => {
  assert.equal(matchProtectedPath("", PROTECTED), null);
  assert.equal(matchProtectedPath(null, PROTECTED), null);
  assert.equal(matchProtectedPath("some/path", []), null);
  assert.equal(matchProtectedPath("some/path", null), null);
});

test("leading ./ is normalized away", () => {
  assert.equal(
    matchProtectedPath("./.obsidian/app.json", PROTECTED),
    ".obsidian/app.json",
  );
});
