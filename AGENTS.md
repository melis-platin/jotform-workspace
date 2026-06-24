# JotForm App Builder - Monorepo

## Project Context
Before starting any task, read the project memory for full architecture details:
- `~/.codex/memories/jotform-workspace/MEMORY.md`
- Start with `~/.codex/memories/jotform-workspace/project_jf_workspace.md` for the monorepo architecture.
- `CLAUDE.md` contains the legacy Claude project context and should be treated as supplemental context when onboarding.

## Key Rules
- Never override component styles from builder — fix at source in app-elements or design-system
- Never use hardcoded values — always use design tokens
- Builder UI uses `--ds-*` tokens and Circular font from design-system
- Canvas components use app-elements tokens (`--fg-*`, `--bg-*`, `--space-*`, `--radius-*`)
- Icons: builder UI uses design-system Icon (SVG fetch), canvas uses app-elements Icon (lucide/phosphor/tabler)

## Local Dev Server
- When the user asks to start the project locally, run the Vite app with `--host 0.0.0.0` so both `localhost` and the local-network URL are available.
- When the user says they want to share a link with people who are not on the same internet/network, use `ngrok` instead of only the local-network URL.
- For ngrok sharing, read the assigned ngrok host first, then start/restart Vite with `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<ngrok-host>` so Vite accepts the public URL.
