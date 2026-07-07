---
name: jotform-cx-design
description: Use this skill to generate well-branded interfaces and assets for the Jotform Customer Experience (Support) admin product, either for production or throwaway prototypes/mocks/slides. Contains Jotform brand colors, type, logos, iconography rules and a UI kit of the internal CX Support admin components (sidebar, topbar, KPI cards, agent tables, team-coverage timelines, dashboards).
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, the `assets/` folder, the `ui_kits/cx-support/` folder, and `preview/` cards).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Always link `colors_and_type.css` and prefer semantic tokens (`--fg-1`, `--bg-surface`, `--status-success`, `var(--jf-orange)`) over raw palette values.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design (a new dashboard? a slide deck? an email? an internal tool screen?), ask some questions about audience + surface + fidelity, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key facts to keep in mind:
- Product: **Jotform CX Support** — an internal operations console. Dark-navy sidebar, white content area, dense dashboards.
- Brand name: always **Jotform** (lowercase "f"). Never "JotForm".
- Voice: neutral, data-forward, terse. No emoji. No exclamation marks. Title Case for headings, sentence case for everything else.
- Visual language: flat cards with hair-thin borders, no gradients, no illustrations. Orange is for actions only.
- Primary family: Inter (stand-in for Circular). Numerics are `tabular-nums` on KPI tiles.
