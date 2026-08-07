# CI — GitHub Actions + Dependabot (CLI package)

## Goal

Add non-interactive CI for the **create-my-custom-app** CLI package repo: GitHub Actions on pull requests (and pushes to the default branch) plus Dependabot for dependency updates. Match AGENTS.md §17 without expanding into Semantic Release, Checkly, e2e, or generated-app template CI.

## Skills read

- None from `.agents/skills/` (no `coderabbit` / DX skills present yet; CI guidance taken from `AGENTS.md` §17 and §21)

## Existing code inspected

- `package.json` — scripts: `build`, `clean`, `dev`, `prepublishOnly`; no `typecheck` / `lint`
- `tsconfig.json` — `strict: true`, `rootDir: ./src`, excludes `dist`
- `src/cli.ts` — interactive mock CLI (`@clack/prompts` + `picocolors`)
- `templates/default/` — placeholder README only (not a runnable Next.js app yet)
- `.gitignore` — ignores `package-lock.json` (blocks reliable `npm ci` in CI)
- No `.github/` workflows today
- Repo root is `create-my-custom-app/` (git toplevel)

## Decisions / assumptions

1. **Scope = this CLI package only.** Do not add GitHub Actions / Dependabot / CodeRabbit into `templates/` until the generated app exists.
2. **Checks in CI:** `typecheck` + `build` (CLI §21). Skip Oxlint/Oxfmt until DX tooling is added; do not invent ESLint/Prettier.
3. **Node.js 24** (AGENTS.md requirement). Use `ubuntu-latest`, `npm ci`.
4. **Commit `package-lock.json`:** remove it from `.gitignore` so CI and Dependabot use a locked install. Keep the existing lockfile in the repo.
5. **Triggers:** `pull_request` + `push` to `main` (or `master` if that is the default branch — detect from git).
6. **Out of scope:** CodeRabbit YAML, Semantic Release, Checkly, e2e, Codecov, template-app CI, interactive scaffold smoke in Actions (CLI is prompt-driven; non-interactive flags do not exist yet).

## Files likely to change

| Path | Change |
|------|--------|
| `.github/workflows/ci.yml` | New — install, typecheck, build |
| `.github/dependabot.yml` | New — weekly npm + github-actions |
| `package.json` | Add `"typecheck": "tsc --noEmit"` |
| `.gitignore` | Stop ignoring `package-lock.json` |

No changes to `src/cli.ts` or `templates/` unless typecheck reveals a fix.

## Implementation requirements

1. Add `npm run typecheck` → `tsc --noEmit` (uses existing `tsconfig.json`).
2. Create `.github/workflows/ci.yml`:
   - name: CI (or equivalent)
   - `on: pull_request` and `push` to default branch
   - job: checkout → setup-node@v4 with Node 24 + npm cache → `npm ci` → `npm run typecheck` → `npm run build`
   - No secrets required
3. Create `.github/dependabot.yml`:
   - `npm` ecosystem at `/`, weekly
   - `github-actions` ecosystem at `/`, weekly
4. Remove `package-lock.json` from `.gitignore`; ensure lockfile remains tracked.
5. Keep CI fully non-interactive (no CLI prompts).

## Security requirements

- No secrets in workflow files or the repo
- Dependabot PRs only; no auto-merge
- Do not log or commit credentials

## Acceptance criteria

- [ ] PR / push to default branch runs a green CI job with typecheck + build
- [ ] `npm run typecheck` and `npm run build` succeed locally
- [ ] Dependabot config is valid and targets npm + GitHub Actions
- [ ] `package-lock.json` is not gitignored and is present for `npm ci`
- [ ] No lint/format tooling added; no template CI; no e2e / release automation

## Checks to run

From package root:

```bash
npm run typecheck
npm run build
```

Validate workflow YAML is well-formed (syntax / structure review). Do not claim Actions passed on GitHub without a real run.

## Exact manual test steps (after implementation)

1. From `create-my-custom-app/`: `npm run typecheck` — expect exit 0.
2. `npm run build` — expect `dist/cli.js` updated, exit 0.
3. Confirm `.github/workflows/ci.yml` and `.github/dependabot.yml` exist.
4. Confirm `.gitignore` no longer lists `package-lock.json`.
5. Push a branch / open a PR (when ready) and confirm the CI check appears on GitHub.
