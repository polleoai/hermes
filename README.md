# Hermes — renamed to Gryphon

> **This project has been renamed to Gryphon and is now developed at [polleoai/gryphon](https://github.com/polleoai/gryphon).**
>
> Hermes was briefly published as v1.0.0 on 2026-04-23 and renamed shortly after to avoid confusion with the unrelated Hermes agentic system. This repository is archived for historical reference; all active development continues under the Gryphon name.

## Migrating from Hermes to Gryphon

Both can coexist in your vault — they have different plugin ids, so installing Gryphon won't disturb a working Hermes install.

1. **Install Gryphon** via BRAT: `polleoai/gryphon`
2. **Before launching Gryphon**, copy your settings:
   ```
   cp .obsidian/plugins/hermes/data.json .obsidian/plugins/gryphon/data.json
   ```
   This preserves your API key, permission mode, and all protected-pattern toggles. `data.json` is plain JSON — nothing encrypted, nothing to derive.
3. **Launch Gryphon.** Your `Hermes/` vault folder (skills, exports, MANUAL.md) auto-renames to `Gryphon/` on first run.
4. **Disable and uninstall Hermes** from Obsidian → Settings → Community Plugins.

## Historical artifacts

The final Hermes v1.0.0 release is preserved on this repo at the [`hermes-final-v1.0.0`](https://github.com/polleoai/hermes/tree/hermes-final-v1.0.0) tag. The release page with the original v1.0.0 assets remains intact at [Releases](https://github.com/polleoai/hermes/releases).

For new installs, please use [polleoai/gryphon](https://github.com/polleoai/gryphon).
