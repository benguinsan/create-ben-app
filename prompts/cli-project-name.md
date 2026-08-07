# CLI — First prompt: project name

## Goal

Implement the **first interactive step** of `create-my-custom-app`: ask **“What will your project be called?”** via `@clack/prompts`, validate the name, handle cancel, and leave a clear handoff for later scaffold steps. Do **not** wire template copy, feature selection, git/install, or flags in this slice.

## Skills read

- None from `.agents/skills/` (CLI UX uses `@clack/prompts` / `picocolors` per AGENTS.md §3; no dedicated skill)

## Existing code inspected

- `AGENTS.md` — interactive flow starts with intro + Clack prompts; cancel via `isCancel`; style with `picocolors`
- `package.json` — `bin: dist/index.js`; deps include `@clack/prompts`, `picocolors`, `commander`, `create-create-app`; scripts use `tsup` → `dist/index.js`
- `tsup.config.ts` — entry is `src/index.ts` (file missing); alias `~` → `src`
- `src/cli.ts` — empty placeholder (0 bytes); no `src/index.ts`
- `dist/index.js` — prior build already had this prompt (`What will your project be called?`) plus later feature/git/install questions; **source was wiped** — recreate a minimal first-step CLI, not the full prior surface
- `templates/` — empty / absent; no scaffold in this task
- `prompts/ci-github-actions.md` — separate CI work; unrelated except it assumed an interactive `src/cli.ts`

## Decisions / assumptions

1. **Scope = project name only.** Intro → text prompt → echo result → outro. No multiselect, git, install, import alias, Commander flags, or `create-create-app` copy yet.
2. **Prompt copy:** message `What will your project be called?`; default / placeholder `my-app`.
3. **CLI arg:** if the user already passed a directory/name as the first positional arg (`node dist/index.js my-app`), **skip** the name prompt and use that value (still validate). If missing/invalid, fall through to the interactive prompt.
4. **Validation:** npm-package-style name — non-empty, trim whitespace, max 214 chars, no leading `.` / `_`, lowercase npm name regex (scoped packages allowed). On invalid interactive input, Clack `validate` returns an error string.
5. **Cancel:** on Ctrl+C / Clack cancel → `cancel("Operation cancelled.")` and `process.exit(1)`.
6. **Entry alignment:** implement in `src/index.ts` to match `tsup.config.ts` / `package.json` `bin`. Keep or thin `src/cli.ts` only if useful as a re-export; prefer a single entry (`src/index.ts`) to avoid dual sources. Do not rename bin/`dist` in this slice unless required for build.
7. **TTY:** if stdin is not a TTY and no name arg was given, print a clear error with `picocolors` and exit non-zero (do not hang).
8. **Out of scope:** template scaffolding, `ora`, feature modules, CI flags, README template string docs cleanup.

## Files likely to change

| Path | Change |
|------|--------|
| `src/index.ts` | New — CLI entry: intro, name prompt/arg, validation, cancel, outro |
| `src/cli.ts` | Remove empty file **or** re-export from `index` if kept; avoid two competing entrypoints |
| `src/validate-name.ts` (optional) | Extract name validator if it keeps `index.ts` small |

No changes to `templates/`, CI, or package deps unless a missing import breaks the build (deps already present).

## Implementation requirements

1. Shebang / Node CLI: built output remains runnable as `node dist/index.js` and via `bin`.
2. `intro` with a simple brand label (e.g. package name styled with `picocolors`).
3. Resolve project name:
   - From `process.argv` positional arg if present and valid, else
   - `text({ message: "What will your project be called?", defaultValue: "my-app", placeholder: "my-app", validate })`
4. After success: `note` or short success line showing the chosen name; `outro` with a one-line next-step hint (scaffold not implemented yet).
5. Handle `isCancel` on the text result.
6. TypeScript strict; no `any`.
7. Do not call `create-create-app` yet.

## Security requirements

- No secrets, env files, or network calls
- Validate name before any future filesystem use (reject path traversal / empty / invalid package names)

## Acceptance criteria

- [ ] `npm run build` produces `dist/index.js`
- [ ] Running without args in an interactive terminal shows intro + **What will your project be called?**
- [ ] Entering a valid name prints that name and exits 0
- [ ] Cancel exits cleanly with a cancel message (non-zero)
- [ ] Invalid names are rejected by validation in the prompt
- [ ] `node dist/index.js my-cool-app` skips the prompt (or accepts the arg) and uses `my-cool-app`
- [ ] No template copy, feature prompts, or install/git questions yet

## Checks to run

From `create-my-custom-app/`:

```bash
npm run typecheck
npm run build
```

Smoke (interactive):

```bash
node dist/index.js
# answer the name prompt

node dist/index.js smoke-app
# should use smoke-app without asking (if arg path implemented)
```

## Exact manual test steps (after implementation)

1. `cd create-my-custom-app && npm run build`
2. `node dist/index.js` — expect Clack intro and **What will your project be called?**; accept default or type `demo-app`; expect success/outro mentioning `demo-app` (or default).
3. `node dist/index.js` then Ctrl+C / cancel — expect cancel message and non-zero exit.
4. `node dist/index.js my-app` — expect no name prompt (or confirmation only of that name) and outro with `my-app`.
5. Confirm no new project folder was created (scaffold not in scope).
