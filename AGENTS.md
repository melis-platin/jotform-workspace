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
- Settings tab left navigation must follow the Figma source of truth: **Archieve 27.03.2026**, node `1:307129`. Preserve its 318px panel, spacing, 40px icon area, active/inactive typography, and token-based colors when making future changes.
- Publish tab left navigation must follow the Figma source of truth: **Archieve 27.03.2026**, node `1:307144`. Preserve its 318px panel, four-item layout, spacing, 40px icon area, active/inactive typography, and token-based colors when making future changes. When Push Notifications opens, it must keep this exact Publish navigation and select only the Push Notifications item, as specified by **New Workspace** node `1231:15669`; never replace it with the Settings navigation.
- Publish > Push Notifications > Send Notification must keep the same canvas origin as the Push overview: 36px top padding (`calc(var(--spacing-2xl) + var(--spacing-2xs))`) and an 80px gap after the left panel (`calc(var(--spacing-4xl) + var(--spacing-md))`). Apply these token-based values to both states to prevent layout jumps; do not alter this rule.
- Publish > Push Notifications > Schedule Notification: the SCHEDULE action must remain disabled until both Notification Title and Notification Content have a value (including inserted field tokens), as well as a valid send date and time. Never relax this requirement.
- Publish > Push Notifications > Schedule Notification: when Custom is selected in Quick Picks, Send Time must always show the current selectable time rather than a placeholder. Manual date or time changes must switch to Custom without clearing the value the user just selected. Never change this behavior.
- App preset hero headers with transparent mobile top navigation must keep the visible gap from the top nav/avatar row to the hero title equal to the visible gap from the hero CTA to the first page card. Preserve this as one shared layout rule; do not rebalance it with one-off per-preset overrides.
- Preset app Button components must be text-only. Do not use left or right icons in preset buttons; set both `Left Icon` and `Right Icon` to `none`. This applies to preset page buttons and header action buttons, but does not ban icons in app logos, cards, lists, navigation, or other non-button components.

## Local Dev Server
- When the user asks to start the project locally, run the Vite app with `--host 0.0.0.0` so both `localhost` and the local-network URL are available.
- When the user says they want to share a link with people who are not on the same internet/network, use `ngrok` instead of only the local-network URL.
- For ngrok sharing, read the assigned ngrok host first, then start/restart Vite with `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<ngrok-host>` so Vite accepts the public URL.
