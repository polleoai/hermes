# Hermes — Changelog

All notable changes to the Hermes Obsidian plugin are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning is [SemVer](https://semver.org/).

## [1.0.0] — 2026-04-23

The first stable release of Hermes.

Hermes is an Obsidian plugin that integrates Anthropic's Claude directly into your vault: read and edit notes, run tools, and chat with context drawn from your own notebook. It's built around a **two-axis security model** — permission modes (convenience) and protected-pattern rules (guardrail) are independent axes, so turning auto-approve all the way up never weakens the rules that matter.

### Chat

- Streaming conversation panel alongside your notes
- Two provider options: Anthropic API (recommended — uses your Anthropic API key directly) or Claude Code (advanced — spawns a locally-installed `claude` subprocess, subject to that product's terms)
- Per-conversation model and effort selection
- Slash commands, keyboard shortcuts, skills — built around Obsidian power-user workflows

### Two-axis security

**Permission modes** control prompt cadence: Prompt (ask every edit), Safe (auto-approve edits, prompt on shell), YOLO (silence everything except the guardrail), Plan (propose-only).

**Protected-pattern rules** are a per-pattern checklist — a toggleable list of file paths and shell-command shapes that always require explicit modal approval, regardless of permission mode. Default rules ship across seven categories:

- `network-fetch` — commands pulling content from the internet
- `runs-arbitrary-code` — shell interpreters, `eval`, pipe-to-shell, stdin-to-interpreter
- `destructive-operation` — recursive delete, disk wipe, bulk remove
- `persistent-execution` — scheduled tasks, cron, shell-rc writes, registry persistence
- `accesses-system` — writes into system or credential directories
- `escalates-privileges` — `sudo`, `su`, `doas`, `pkexec`
- `network-exec` — commands targeting another computer (e.g., `ssh host '<command>'`)

Users can add custom patterns or disable defaults individually. Detection runs through Unicode normalization (NFKC + zero-width-strip) so obfuscated forms — fullwidth `ｒｍ`, zero-width-joined `r​m` — are caught.

Auto-deny mode refuses matched patterns without a modal, for users who prefer curating their pattern list over dismissing prompts. Both modes work in SDK and local-CLI providers.

### Platforms

macOS, Windows, Linux. Both providers work on all three.

### Security

- Disclosure channel: `hermes@polleo.ai` — see `SECURITY.md` for the reporting process and response timeline.
- No telemetry. Your vault content and your API calls stay on your machine.
- Classifier module-boundary constraints documented in `docs/adr/0001-command-classifier-boundary.md`.

### Known limitations

- **Cyrillic homoglyph command names** (e.g., `рm` using Cyrillic `р`) are not caught. The classifier applies NFKC normalization, which collapses fullwidth Latin characters, but does not apply a confusables fold for visually-similar codepoints from other scripts. In practice, AI models do not emit such commands — defense-in-depth depends on the model layer here. See `docs/adr/0001` for the rationale.

### License

MIT. Copyright © 2026 POLLEO.AI.


---

This is the first public release. Subsequent releases will be added
above as they ship.
