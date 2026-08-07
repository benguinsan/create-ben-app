# Feature — Oxlint + Oxfmt (Ultracite)

## Goal

Add optional **Oxlint + Oxfmt (Ultracite)** as an A-flat overlay: `templates/oxlint-oxfmt/`, interactive Linter/formatter choice (**Oxlint + Oxfmt** **or** keep CNA default), and scaffold merge so selecting Oxlint overlays onto `templates/default` (and any other selected features), **replaces** CNA ESLint as the primary linter, and leaves no dual-linter mess. Skipping keeps the CNA ESLint setup untouched. Do **not** add Lefthook / lint-staged / Commitlint in this slice.

## Skills read

- No Oxlint/Oxfmt/Ultracite skill in `AGENTS.md` §3 — **do not invent** `.agents/skills/oxlint` (or similar). Use Ultracite docs + project patterns.
- Ultracite Oxlint provider: `oxlint.config.ts` extends `ultracite/oxlint/core` + `react` + `next`; `oxfmt.config.ts` spreads `ultracite/oxfmt`; scripts via `ultracite check` / `ultracite fix` (or equivalent `lint` / `format`).
- `AGENTS.md` §6 DX, §8 Linter row, §10 “do not leave both CNA ESLint and Oxlint as primary linters”, §19 DX tooling.

## Existing code inspected

- `AGENTS.md` — Linter = Oxlint + Oxfmt **or** keep CNA default → `templates/oxlint-oxfmt`; when selected, replace CNA ESLint; never copy when skipped; not in `default`.
- `src/index.ts` — intro → project name → Auth select → Docker confirm → scaffold; flags `--auth`, `--docker` / `--no-docker`; next-steps Auth/Docker-aware; no linter prompt/flag yet.
- `src/scaffold.ts` — `FeatureId` = `"clerk-auth" | "docker"`; copies `default`, overlays features; merges `package.json` (union merge — **cannot remove** deps today); no file-deletion API.
- `templates/default/` — CNA primitive: `eslint.config.mjs`, `lint: "eslint"`, `eslint` + `eslint-config-next` in `devDependencies`.
- `templates/oxlint-oxfmt/` — does not exist.
- `templates/docker/` — overlay pattern to mirror (scripts-only `package.json`, no README overwrite).
- Prior prompts `prompts/docker.md`, `prompts/clerk-auth.md` — opt-in confirm/select + flag + overlay wiring.

## Decisions / assumptions

1. **Interactive prompt:** after Auth and **before** Docker (catalog order: Auth → … → Linter → … → Docker), ask via `@clack/prompts` `select`:
   - message: **Linter / formatter?** (or equivalent clear product wording)
   - options:
     - **Oxlint + Oxfmt** (`value: "oxlint"`) — hint: Ultracite presets; replaces ESLint
     - **ESLint (CNA default)** (`value: "eslint"`) — hint: keep create-next-app linter
   - `initialValue: "eslint"` (opt-in for Oxlint)
   - Cancel → cancel message + exit non-zero.
2. **Non-interactive / CI:** support `--linter oxlint` and `--linter eslint` (also `--linter=oxlint` / `--linter=eslint`). When not a TTY and flag unset, default to **eslint** (keep CNA). Invalid values → red error + exit 1. Log a dim summary when flag-driven. Update positional-name parsing to skip `--linter` + its value (same pattern as `--auth`).
3. **Scaffold:** extend `FeatureId` with `"oxlint-oxfmt"`. Overlay order when multiple selected: `clerk-auth` → `oxlint-oxfmt` → `docker` (stable, predictable). Same placeholders (`{{name}}`, `{{description}}`).
4. **ESLint replacement (required):** selecting Oxlint must **not** leave both toolchains as primary:
   - **Delete** generated `eslint.config.mjs` (default ships it; overlay copy cannot remove files today).
   - **Remove** `eslint` and `eslint-config-next` from `devDependencies`.
   - Replace `scripts.lint` with Ultracite/Oxlint-driven scripts; add format/check scripts.
   - Implement **generic** scaffold support (prefer over hardcoding feature ids in `scaffold.ts`):
     - **File removals:** if overlay contains `.scaffold-rm` (newline-separated relative paths), delete those paths under `targetDir` after copying that overlay (ignore missing; skip `..` / absolute paths).
     - **Dependency removals:** extend `mergePackageJson` so overlay `dependencies` / `devDependencies` values of `null` mean **delete that key** from the merged map (JSON cannot have `undefined`; document `null` in overlay `package.json`).
5. **Overlay contents (isolatable):**
   - `oxlint.config.ts` — Ultracite presets for this Next + React app:
     ```ts
     import { defineConfig } from "oxlint";
     import core from "ultracite/oxlint/core";
     import next from "ultracite/oxlint/next";
     import react from "ultracite/oxlint/react";

     export default defineConfig({
       extends: [core, react, next],
       ignorePatterns: core.ignorePatterns,
     });
     ```
   - `oxfmt.config.ts`:
     ```ts
     import { defineConfig } from "oxfmt";
     import ultracite from "ultracite/oxfmt";

     export default defineConfig({
       ...ultracite,
     });
     ```
   - `package.json` fragment:
     - **scripts:** e.g. `"lint": "ultracite check"`, `"format": "ultracite fix"` (and optionally `"check": "ultracite check"` if useful — prefer minimal: at least `lint` + `format` so AGENTS §21 is satisfied). Do not keep `"lint": "eslint"`.
     - **devDependencies:** pin current stable `ultracite`, `oxlint`, `oxfmt` (whatever Ultracite’s Oxlint provider expects as peers — install the set that makes `ultracite check` / `ultracite fix` work). Use caret ranges consistent with other overlays.
     - **null removals:** `"eslint": null`, `"eslint-config-next": null` under `devDependencies`.
   - `.scaffold-rm` containing:
     ```
     eslint.config.mjs
     ```
   - Optional minimal `.vscode/settings.json` for Oxc / format-on-save **only if** it stays small and does not fight CNA; prefer skip if unsure — editor polish can wait. Do **not** overwrite `AGENTS.md` / `CLAUDE.md` / `README.md` in this overlay (avoid clobbering default or Clerk README).
   - **Do not** enable Ultracite optional `js-plugins` (eslint-plugin-github / sonarjs / react-doctor) in v1 — keep the fast native path.
6. **Next-steps:** when Oxlint selected, append a short note that lint/format use Oxlint + Oxfmt (e.g. `npm run lint`, `npm run format`) and that ESLint was replaced. Keep Auth/Docker steps unchanged when those features are on.
7. **Scope of this slice:** Linter select + `--linter` flag + `templates/oxlint-oxfmt` + scaffold `FeatureId` + generic `.scaffold-rm` + `null` dep removal. Do not add Database / Sentry / Lefthook / other feature prompts. Do not invent an Oxlint skill file. Do not put Oxlint into `templates/default`.
8. **Out of scope:** Lefthook, lint-staged, Commitlint, Husky, Biome, keeping ESLint alongside Oxlint, Ultracite agent hooks, rewriting default template lint setup.

## Files likely to change

| Path | Change |
|------|--------|
| `src/index.ts` | Linter select after Auth / before Docker; `--linter`; pass `oxlint-oxfmt` in features; Oxlint-aware next steps; skip `--linter` in positional parser |
| `src/scaffold.ts` | Add `"oxlint-oxfmt"` to `FeatureId`; `.scaffold-rm` handling; `null` removes keys in dep merge |
| `templates/oxlint-oxfmt/**` | New: configs, `package.json` fragment, `.scaffold-rm` |
| `templates/default/**` | **No** Oxlint/Oxfmt (must stay CNA ESLint) |
| `.agents/skills/**` | **No** new skill |

## Implementation requirements

1. Clack `select` with clear Oxlint vs ESLint (CNA) labels; handle `isCancel`.
2. Only copy `templates/oxlint-oxfmt` when user chooses Oxlint (or `--linter oxlint`).
3. Overlay must be isolatable: skip/delete folder ⇒ no Oxlint artifacts; ESLint path unchanged.
4. After Oxlint overlay, generated app must **not** retain `eslint.config.mjs` or `eslint` / `eslint-config-next` in `package.json`.
5. `npm run lint` in the generated Oxlint app must invoke Ultracite/Oxlint (not ESLint).
6. Do not put `@clack/prompts` / `picocolors` / `ora` into the generated app.
7. TypeScript configs must typecheck against the pinned packages (valid imports from `oxlint`, `oxfmt`, `ultracite/*`).

## Security requirements

- No secrets, env vars, or network calls in this overlay.
- Do not add postinstall scripts that download remote config silently.
- Config files are local-only; no telemetry opt-in beyond what the packages themselves do by default (do not enable extra telemetry).

## Acceptance criteria

- [ ] Choosing **ESLint (CNA default)** (or `--linter eslint` / non-TTY default) leaves `eslint.config.mjs`, `lint: "eslint"`, and ESLint deps; no `oxlint.config.ts` / `oxfmt.config.ts` / ultracite deps.
- [ ] Choosing **Oxlint + Oxfmt** (or `--linter oxlint`) produces `oxlint.config.ts`, `oxfmt.config.ts`, Ultracite/oxlint/oxfmt deps, updated lint/format scripts, **and** removes `eslint.config.mjs` + ESLint packages.
- [ ] `templates/default` remains free of Oxlint/Oxfmt and keeps CNA ESLint.
- [ ] Cancel during Linter select exits cleanly before scaffold write.
- [ ] Clerk and/or Docker combined with Oxlint still work (no README clobber from oxlint overlay; docker/clerk files remain).
- [ ] CLI `npm run typecheck` / `npm run build` pass; smoke scaffold both linter paths.

## Checks to run

From `create-my-custom-app/`:

```bash
npm run typecheck
npm run build
```

Smoke:

```bash
# Keep CNA ESLint
node dist/index.js lint-eslint-demo --auth none --linter eslint --no-docker
# confirm: eslint.config.mjs present; no oxlint.config.ts; lint script is eslint

# Oxlint + Oxfmt
node dist/index.js lint-oxlint-demo --auth none --linter oxlint --no-docker
# confirm: oxlint.config.ts + oxfmt.config.ts; no eslint.config.mjs;
# package.json has ultracite/oxlint/oxfmt, no eslint / eslint-config-next;
# scripts.lint is ultracite (or oxlint) based; next-steps mention lint/format
```

Optional (in generated Oxlint app):

```bash
cd lint-oxlint-demo && npm install && npm run lint
```

## Exact manual test steps (after implementation)

1. `cd create-my-custom-app && npm run build`
2. `node dist/index.js ox-no-app --auth none --no-docker` → choose **ESLint (CNA default)** → confirm CNA lint files only.
3. `node dist/index.js ox-yes-app --auth none --no-docker` → choose **Oxlint + Oxfmt** → confirm Oxlint configs, ESLint removed, next-steps mention lint/format.
4. Cancel at Linter select → cancel message, non-zero exit, no project written.
5. `node dist/index.js ox-clerk-docker --auth clerk --linter oxlint --docker` → Clerk + Oxlint + Docker files all present; README still Clerk’s; no `eslint.config.mjs`.
6. Optional: in `ox-yes-app`, `npm install && npm run lint` (and `npm run format` if script exists).
