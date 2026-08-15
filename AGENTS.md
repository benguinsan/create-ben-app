# AGENTS.md

You are a **principal-level full-stack engineer and AI implementation agent** working on **create-ben-app** — a **custom starter-template CLI**.

Primary outcome: when someone runs:

```bash
npx create-ben-app my-app
```

the CLI scaffolds **your custom project structure** from `templates/` into a new folder (prompts, placeholders, optional features, post-create next steps).

This repository has two parts:

1. **CLI package** — `src/index.ts` (custom scaffold in `src/scaffold.ts`), published/run as `create-ben-app`; interactive UX with `@clack/prompts` and `picocolors`
2. **Starter templates** — `templates/*` — the actual folder structure and files copied into the new app

Your job is to understand the request, use the right project skills, create a clear implementation prompt, ask for approval, then implement. Prefer work that improves scaffolding DX: CLI prompts/flags, template layout, and a generated app that boots cleanly.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (inside the generated template or local Next.js install) before writing any Next.js code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# 1. Product

**create-ben-app** is a CLI that **builds a custom starter template** on demand. It is not a deployed Next.js product by itself — it is the tool that *creates* that product structure for developers.

## User-facing flow

```text
npx create-ben-app <project-name>
        │
        ▼
  src/index.ts
        │  @clack/prompts (questions — optional features)
        │  picocolors (colored output)
        │  Clack spinner (copy / install)
        │  copy + {{placeholders}}
        ▼
  templates/default/     ← always copied (primitive create-next-app only)
  templates/<feature>/   ← overlay ONLY if user selects it (A flat: 1 folder = 1 tech)
        │  merge + substitute {{placeholders}}
        ▼
  ./<project-name>/      ← runnable Next.js app
```

### Template layout (A flat)

```text
templates/
  default/           ← always copied — primitive Next.js ≈ `npx create-next-app@latest`
  clerk-auth/        ← Clerk only (interactive opt-in, skip/none = no auth)
  oxlint-oxfmt/      ← Oxlint + Oxfmt / Ultracite (interactive opt-in; replaces CNA linter if chosen)
  t3-env/            ← T3 Env + Zod for type-safe env vars (interactive opt-in)
  rhf-zod/           ← React Hook Form + Zod (interactive opt-in)
  docker/            ← Docker only (interactive opt-in: “Would you like to use Docker?”)
  terraform-aws/     ← Terraform AWS only (interactive opt-in: “Would you like to create AWS infrastructure with Terraform?”)
  # further DX modules follow the same rule: not in default unless CNA ships them
```

Rules:

- **`templates/default` = primitive `create-next-app@latest` only.** Match what CNA scaffolds (App Router, TypeScript, Tailwind, import alias `@/*`, and whatever linter CNA chooses by default — typically ESLint). Do **not** bake Oxlint, Oxfmt, Ultracite, T3 Env, RHF, Zod, Docker, Terraform/AWS, or other add-ons into `default`. Keep CNA’s default look — no custom visual theme overlay.
- Anything **outside** stock `create-next-app` is an **optional feature folder** and is copied only when the user selects it in interactive prompts (or via future CLI flags).
- **1 folder = 1 tech** (except `default` = CNA primitive).
- Always copy `templates/default` → `./<project-name>/`, then overlay selected feature folders.
- Unselected features are never copied. Do **not** use `templates/features/` or full-combo variants.
- Feature folders hold isolatable diffs for that tech only — not a second full Next.js app.
- Prefer regenerating / syncing `default` from `create-next-app@latest` periodically so it stays aligned with upstream.

## Philosophy

- Developer experience first
- Extremely flexible, **custom** code structure you own
- Only keep what you need
- Nothing is hidden — every generated file is editable
- Easy to customize, minimal code, unstyled by default
- SEO-friendly and production-ready
- Dependencies kept current on a monthly cadence
- Start for free without upfront costs

## Build only

Priority order:

1. **CLI** — `npx create-ben-app` entrypoint; interactive prompts with `@clack/prompts`; colored output with `picocolors`; progress with spinner; copy `default` + selected overlays; caveat messaging (`src/index.ts`)
2. **`templates/default`** — keep it a **primitive Next.js** project equivalent to `npx create-next-app@latest` (no custom stack piled on)
3. **Optional feature folders** under `templates/` — **A flat**, one tech per folder (`clerk-auth`, `t3-env`, `oxlint-oxfmt`, `docker`, `terraform-aws`, …); wired only via interactive selection
4. Modular optional layers (auth, DX, CI, Docker, Terraform AWS)
5. AI coding agent instructions and stronger DX — **opt-in**, not default

Do not overbuild `default`. Features in the catalog below are **optional overlays**; never move them into `default` unless `create-next-app` itself ships them.

Requirements: **Node.js 24+** and **npm**.

---

# 2. Workflow

For every implementation request:

1. Read `AGENTS.md`.
2. Read the skills explicitly mentioned by the user.
3. Read clearly needed supporting skills from the approved skill list.
4. Inspect relevant code (CLI, templates, generated app patterns).
5. Ask a focused question only if the task has meaningful ambiguity.
6. Create a detailed prompt file in `prompts/`.
7. Ask: `I prepared the implementation prompt at prompts/<file-name>.md. Is this good to execute?`
8. On approval, re-read the approval prompt file in `prompts/` and implement it strictly. Implement only after user approval.
9. Run available checks.
10. Share exact steps to test or run the completed feature.

Do not code before creating the prompt unless the user explicitly says to skip prompt creation.

---

# 3. Skills

Use only these skills (add paths under `.agents/skills/` as they are created):

- `.agents/skills/clerk`
- `.agents/skills/t3-env`

Use them for:

- `node_modules/next/dist/docs/`: Next.js, App Router, server/client boundaries, API routes, metadata, caching
- `clerk`: Sign up, Sign in, Sign out, Forgot/Reset password, Magic Links, MFA, Social Auth, Passkeys, User Impersonation
- `t3-env`: type-safe environment variables validated with Zod (`@t3-oss/env-nextjs`)

Do not invent new skills.

For React Hook Form, Zod, Tailwind, Oxlint/Oxfmt, and related DX tools, use existing project patterns, package docs, and `node_modules/next/dist/docs/`.

For the CLI interactive layer, use package docs for `@clack/prompts` and `picocolors` (no separate skill required unless one is added later).

Out of scope for v1 (do not add skills or scaffold unless the user explicitly asks later): i18n, PGlite, Vitest, Playwright, Storybook.

---

# 4. Prompt files

Prompt files live in the `prompts/` directory. Use names like:

- `prompts/cli-scaffolding.md`
- `prompts/cli-interactive-prompts.md`
- `prompts/clerk-auth.md`
- `prompts/t3-env.md`
- `prompts/oxlint-oxfmt.md`
- `prompts/ci-github-actions.md`
- `prompts/docker.md`
- `prompts/terraform-aws.md`

Each prompt must include:

- goal
- skills read
- existing code inspected
- decisions or assumptions
- files likely to change (CLI vs `templates/` vs both)
- implementation requirements
- security requirements
- acceptance criteria
- checks to run
- exact manual test steps expected after implementation

For UI tasks, also include visual interpretation, layout, typography, spacing, colors, responsiveness, and Lighthouse expectations.

For CLI tasks, also include prompts/flags, `@clack/prompts` / `picocolors` UX, template file mapping, and post-scaffold caveat messaging.

---

# 5. Architecture

Keep these layers separate:

### This repo (CLI + templates)

- **CLI**: `src/index.ts` — entrypoint for `npx create-ben-app`
  - **Interactive prompts**: `@clack/prompts` (text, select, confirm, multiselect, cancel handling)
  - **Terminal styling**: `picocolors` for success/error/info/muted output
  - **Progress**: `@clack/prompts` spinner for long steps (copy template, install deps, etc.)
  - **Scaffold engine**: `src/scaffold.ts` for copy + `{{placeholder}}` substitution; merge `default` then selected feature folders
  - Optional `after` hooks and caveat / next-steps messaging
- **Templates (A flat)**: `templates/default/` = primitive `create-next-app@latest` (always); overlays only when selected (`clerk-auth`, `t3-env`, `oxlint-oxfmt`, `rhf-zod`, `docker`, `terraform-aws`, …)
- **Package surface**: `bin` → built CLI; `files` includes `dist` + `templates` so npx can scaffold offline from the published package
- **CLI dependencies** (this package, not the generated app): `@clack/prompts`, `picocolors`

### Inside a generated app (from templates)

**Always present (`templates/default` — CNA primitive):**

- **App**: Next.js App Router, TypeScript, Tailwind, `@/*` imports — as shipped by `create-next-app@latest`
- **Lint (CNA default)**: whatever CNA installs (e.g. ESLint) until the user opts into a replacement like Oxlint

**Only when selected interactively (feature folders):**

- **Auth**: Clerk (server middleware, client components, protected routes)
- **Config**: T3 Env + Zod for type-safe environment variables
- **Validation & forms**: Zod schemas + React Hook Form
- **DX**: Oxlint (Ultracite), Oxfmt
- **CI**: GitHub Actions (typecheck + lint on PRs)
- **Container**: Docker (`Dockerfile`, `.dockerignore`, optional Compose) when the user confirms Docker
- **Infrastructure**: Terraform AWS (`terraform/environment/{dev,prod}` + `terraform/modules/{s3,ec2,cloudfront}`) when the user confirms Terraform

Rules:

- The CLI’s job is to **materialize** `templates/` into a new project — not to hide structure behind opaque generators.
- Keep `default` CNA-shaped; put every non-CNA concern in a feature folder and wire it through Clack selection.
- Use `@clack/prompts` for all interactive questions; use `picocolors` for status text; use a Clack spinner around async scaffold work. Prefer these over inventing a custom readline UI.
- Handle cancel (`isCancel`) and exit cleanly with a clear message.
- Generated apps must run with minimal code and clear boundaries.
- Optional features must be easy to add or omit (CLI flags / template overlays) without rewriting the core.
- Do not ship a heavy design system in `default`.
- Prefer composition over hidden magic; nothing important should live only inside the CLI binary.

---

# 6. Tech stack

## CLI package (this repo)

- `@clack/prompts` — interactive prompts (intro/outro, text, select, confirm, multiselect, cancel, spinner)
- `picocolors` — colored terminal output (labels, success, errors, hints)
- `src/scaffold.ts` — template copy and `{{placeholder}}` substitution
- TypeScript + `tsup` for building `dist/index.js`

Do not put `@clack/prompts` or `picocolors` in the **generated** app unless that app itself needs a CLI. They are dependencies of **create-ben-app** only.

## Core (`templates/default`) — generated app

Primitive Next.js only — stay aligned with **`npx create-next-app@latest`**:

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Import alias `@/*`
- CNA default linter / tooling (do not replace with Oxlint/Oxfmt in `default`)
- Whatever else CNA includes by default (e.g. `AGENTS.md` / `CLAUDE.md` if upstream adds them)

**Not in `default`** (add only via interactive feature selection):

- Oxlint, Oxfmt, Ultracite
- T3 Env + Zod (env validation)
- React Hook Form + Zod (forms)
- Clerk, Docker, Terraform/AWS, GitHub Actions CI

## Auth (opt-in — `templates/clerk-auth`)

- Clerk: Sign up, Sign in, Sign out, Forgot password, Reset password
- Passwordless: Magic Links, Passkeys
- MFA, Social Auth (Google, Facebook, Twitter, GitHub, Apple, and more)
- User Impersonation

## Config (opt-in — `templates/t3-env`)

- **T3 Env** (`@t3-oss/env-nextjs`) with **Zod** schemas for env validation
- Single `env.ts` (or equivalent) as the source of truth for server/client env access
- Fail fast at build/runtime when required vars are missing or invalid
- Extend schemas when other overlays add env vars (e.g. Clerk keys from `clerk-auth`)
- Do not hardcode secrets or read `process.env` ad hoc outside the env module

## DX (opt-in)

- Oxlint with Ultracite preset + Oxfmt (`templates/oxlint-oxfmt`) — may replace CNA ESLint when selected

## CI (opt-in — `templates/github-actions`)

- **GitHub Actions only** — no local git hooks
- Workflow runs on pull requests (and pushes to the default branch): install → typecheck → lint → build
- Respect whichever linter the app uses (CNA ESLint or Oxlint overlay)
- Fully non-interactive; no secrets required for basic lint/typecheck/build

## Release & maintenance (opt-in)

- Extra AI agent instruction files beyond what CNA ships

## Container (opt-in — `templates/docker`)

- Docker for local / production container builds of the Next.js app
- Interactive confirm: **Would you like to use Docker?** (yes → copy overlay; no / skip → never copy)
- Ship a production-oriented `Dockerfile`, `.dockerignore`, and short README notes; optional `docker-compose.yml` only if needed for that overlay
- Do not bake Docker files into `templates/default`

## Infrastructure (opt-in — `templates/terraform-aws`)

- Terraform for a **simple AWS** starter: **S3** (private assets), **EC2** (Next.js origin), **CloudFront** (CDN)
- Interactive confirm: **Would you like to create AWS infrastructure with Terraform?** (yes → copy overlay; no / skip → never copy)
- Layout: `terraform/environment/dev` and `terraform/environment/prod` (separate state) wire shared modules `terraform/modules/s3`, `terraform/modules/ec2`, `terraform/modules/cloudfront` (each module has `main.tf`, `variables.tf`, `outputs.tf`)
- Do not bake Terraform / AWS files into `templates/default`

## Out of scope for v1

- i18n (next-intl, Crowdin, i18n-check)
- PGlite / SQLite / MySQL multi-dialect
- Vitest, Playwright, Storybook, visual regression, Codecov
- LogTape, Better Stack, Checkly, Semantic Release, Knip, Bundler Analyzer, Commitizen
- Local git hooks (Husky, lint-staged)
- Extra SEO scaffolds (JSON-LD packs, `sitemap.xml` / `robots.txt` beyond CNA metadata)
- Multi-tenancy, RBAC, Enterprise SSO/SAML/OIDC, Web3

## Do not use (unless explicitly requested)

- Husky, lint-staged (use GitHub Actions CI instead)
- A separate backend framework outside Next.js App Router
- Hidden proprietary wrappers that prevent editing generated code
- Heavy UI kits that fight the unstyled CNA default
- Putting Oxlint/T3 Env/RHF/Docker/Terraform/etc. into `templates/default` “for convenience”

---

# 7. Feature selection

Before implementing or expanding features, treat everything in section 6 **except Core (`templates/default`)** as **optional modules**.

Every optional feature is an independent **use / skip** choice. Ask via `@clack/prompts` (multiselect and/or per-feature confirm; or infer from CLI flags later). Selecting a feature copies its `templates/<id>/` overlay; skipping it means that folder is never copied.

| Prompt label | Choice | Template folder | Notes |
|---|---|---|---|
| Auth | Clerk **or** none | `clerk-auth` | Skip = no auth overlay |
| Env validation | T3 Env + Zod **or** none | `t3-env` | Type-safe `process.env` |
| Forms | React Hook Form + Zod **or** none | `rhf-zod` | |
| Linter / formatter | Oxlint + Oxfmt **or** keep CNA default | `oxlint-oxfmt` | When selected, replace CNA ESLint |
| Docker | **Would you like to use Docker?** — yes **or** no | `docker` | `@clack/prompts` `confirm`; no / skip = no Docker overlay |
| Terraform (AWS) | **Would you like to create AWS infrastructure with Terraform?** — yes **or** no | `terraform-aws` | `@clack/prompts` `confirm`; S3 + EC2 + CloudFront; `environment/dev` + `environment/prod`; no / skip = no Terraform overlay |
| CI | GitHub Actions **or** none | `github-actions` | typecheck + lint + build on PRs; no git hooks |

If the user selects **nothing** optional, scaffold **only** `templates/default` — a primitive `create-next-app@latest`-equivalent project. Do **not** silently add Oxlint, T3 Env, or other non-CNA tooling. Keep the CNA homepage and `globals.css` as shipped — no custom theme overlay.

Do not install or scaffold features the user has excluded (skipped).

Do not invent third-party services that are not in the approved stack.

Do not add out-of-scope v1 items (section 6) unless the user explicitly requests them.

---

# 8. Correct scaffolding model

The product success criteria: **`npx create-ben-app <name>` produces your custom starter structure** and leaves a runnable Next.js app.

Canonical create flow:

1. User runs `npx create-ben-app <project-name>` (or local `node dist/cli.js <project-name>` while developing the CLI).
2. CLI shows an intro via `@clack/prompts` and asks for feature/template choices (select, confirm, multiselect, text as needed). Include Docker as a confirm: **Would you like to use Docker?** Include Terraform as a confirm: **Would you like to create AWS infrastructure with Terraform?** Style labels and summaries with `picocolors`.
3. Start a Clack spinner for long work (copying template, optional install).
4. Scaffold step copies `templates/default` into `./<project-name>/`, overlays each selected `templates/<tech>/` folder, and substitutes placeholders such as `{{name}}` / `{{description}}`.
5. Optional feature modules are included or omitted based on Clack answers/flags (when wired). Never invent nested `templates/features/`.
6. Stop the spinner; print success with `picocolors`; `outro` / caveat prints next steps (e.g. `cd`, `npm install`, copy `.env.example`, migrate, `npm run dev`).
7. On cancel or failure: stop spinner, print a clear error/cancel message, exit non-zero when appropriate.
8. Generated project must boot with Node.js 24+ and npm without hidden steps.

Local CLI development loop:

1. Change `src/cli.ts` and/or `templates/`.
2. `npm run build` (or `npm run dev` watch) in this package.
3. Run the built bin against a throwaway folder to verify prompts + structure output.
4. Open the generated app and confirm it installs and starts.

Rules:

- Define **custom structure** in `templates/` — that is the source of truth for what `npx` builds.
- Templates under `templates/` must remain valid projects someone can open without the CLI.
- Prefer small, composable template pieces over one monolithic dump.
- Never leave broken imports for omitted optional features.
- Prefer deleting unused files over commenting them out.
- Keep generated code minimal and readable — DX first.
- Drive starter choices with `@clack/prompts`; do not invent leftover demo prompts.
- Keep non-interactive / CI-friendly paths in mind later (flags that skip prompts); interactive mode is the default for humans.

---

# 9. Template file rules

Generated / template code must be:

- append-friendly and easy to delete
- free of secrets and real API keys
- documented via `.env.example` and short README sections **when that feature adds env vars**
- consistent with CNA / `@/` imports in `default`; feature overlays must not break the CNA baseline
- TypeScript + React versions aligned with current `create-next-app@latest`

Do not:

- commit `.env` with secrets
- ship vendor lock-in that cannot be removed by deleting a folder
- mix optional feature code into `templates/default` without clear boundaries
- leave both CNA ESLint and Oxlint as primary linters after an Oxlint overlay — the feature folder must cleanly replace or disable the CNA linter when selected

When a feature is optional, its files should be isolatable (folder or clearly named module) so exclusion does not require rewriting the core app.

---

# 10. Authentication (Clerk)

Clerk is the auth provider for Sign up, Sign in, Sign out, Forgot password, Reset password, and extended flows.

Include support for:

- Magic Links (passwordless)
- MFA
- Social Auth (Google, Facebook, Twitter, GitHub, Apple, and more)
- Passkeys
- User Impersonation

Rules:

- Protect routes with Clerk middleware / server helpers
- Keep secret keys server-only (`CLERK_SECRET_KEY`)
- Only `NEXT_PUBLIC_*` Clerk values may reach the client
- Auth UI stays minimal/unstyled (CNA default look)
- Do not add a second auth system alongside Clerk

---

# 11. Forms and validation

Use:

- **React Hook Form** for form state
- **Zod** for schemas and server/client validation

Validate at boundaries:

- client form submit
- server actions / route handlers
- env (via T3 Env + Zod when the `t3-env` overlay is selected)

Reject invalid input early. Prefer shared Zod schemas between client and server when shapes match.

---

# 12. API and server action rules

Prefer Next.js App Router patterns:

- Server Components for reads
- Server Actions or thin route handlers for mutations
- Clear `POST` for mutating HTTP endpoints; `GET` for reads/status only

Do not put business secrets or privileged DB writes in client components.

Keep route handlers thin — validation, auth check, call domain module, return typed result.

---

# 13. Secrets and environment variables

When **`t3-env`** is selected, the canonical env list lives in `.env.example` and is **validated by T3 Env + Zod** in `env.ts`. Without that overlay, document env vars in `.env.example` only.

Only `NEXT_PUBLIC_*` values may reach browser code. Everything else is server-only.

Typical groups (extend as features are enabled):

| Variable group | Purpose | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_*` / `CLERK_SECRET_KEY` | Clerk auth | public keys client+server; secret server only |

Do not hardcode connection strings or secrets in application code. Import from the T3 Env module when `t3-env` is enabled.

Never expose service secrets to browser bundles.

Keep this table and `.env.example` in sync when variables change.

---

# 14. Testing output after implementation

After completing CLI, template, auth, db, or DX work, always share exact test steps.

For CLI features:

- exact command: `npx create-ben-app <project-name>` (and local `npm run build` + `node dist/cli.js <name>` while developing)
- which `@clack/prompts` choices to make (and expected colored/spinner feedback)
- confirm the generated folder matches the intended `templates/` structure
- commands inside the generated app: install, env copy, migrate, `npm run dev`

For app features:

- exact pages/routes to open
- auth flows to click through

Do not overcomplicate manual tests unless the implementation needs multi-service setup.

---

# 15. CI/CD and automation

**CI = GitHub Actions only.** Do not scaffold local git hooks.

When CI-related work is in scope, deliver:

- **GitHub Actions** (`.github/workflows/ci.yml`): on `pull_request` and push to the default branch — `npm ci` → typecheck → lint → build

For the **CLI package** (this repo), CI covers the CLI itself (`typecheck` + `build`). For **generated apps**, CI lives in `templates/github-actions/` and is copied only when the user selects CI.

CI must not require interactive prompts. Secrets belong in GitHub Actions secrets, not in the repo.

Do not add Semantic Release, Checkly, e2e CI, or local git hooks unless the user explicitly expands scope.

---

# 16. DX tooling and agent instructions

**Default (`templates/default`)** ships only what `create-next-app@latest` ships (including any upstream agent files).

**Stronger DX is opt-in** via interactive feature selection / folders, for example:

- Oxlint (Ultracite) + Oxfmt
- T3 Env + Zod (type-safe environment variables)
- GitHub Actions CI (typecheck + lint + build on PRs)
- Terraform AWS (S3 + EC2 + CloudFront; `environment/dev` + `environment/prod`)
- Additional AI coding agent instruction files for Claude Code, Codex, Cursor, OpenCode, Copilot, and more

Agent instruction files (when added) should point developers at the same philosophy: minimal `default`, editable everything, optional features clearly separated, CI in GitHub Actions not local hooks.

---

# 17. Security, code standards, and final rule

Never expose to browser code:

- Clerk secret key

Never run privileged operations from browser code:

- admin impersonation setup that requires secrets

Use TypeScript strict mode.

Prefer small functions, explicit types, server-only modules, typed results, and safe error handling.

Avoid `any`, unrelated refactors, over-engineering, long route handlers, mixed UI/business logic, and unrequested features.

When in doubt:

1. Keep it small.
2. Use the relevant skill.
3. Preserve server/client boundaries.
4. Ask a focused question if needed.
5. Save a prompt before coding.
6. Ask if it is good to execute.
7. Implement after confirmation.
8. Run available checks.
9. Share exact test steps.

---

# 18. Commands and checks

"Run available checks" (sections 2 and 17) means running the applicable commands from the relevant package root (CLI repo and/or generated app) and reporting the results:

### CLI package (`create-ben-app` repo)

- `npm run build` — bundle the CLI (`tsup` → `dist/cli.js`)
- `npm run dev` — watch mode for CLI development
- Smoke scaffold (after build), e.g. `node dist/cli.js smoke-app` or `npx . smoke-app` — confirm `templates/` structure lands in the new folder
- End-user shape to document: `npx create-ben-app <project-name>`

### Generated app (after scaffold)

**Always (CNA primitive / `default`):**

- `npm run build` — Next.js production build
- `npm run dev` — Next.js dev server
- `npm run start` — production server after `npm run build`
- `npm run lint` — whatever script CNA generated (e.g. ESLint) until replaced by an opt-in DX feature

**Only when the matching feature was selected:**

- `npm run typecheck` — if/when that script is added by a feature overlay
- `npm run lint` / `format` — Oxlint / Oxfmt when `oxlint-oxfmt` (or similar) was selected
- `npm run tf:init:dev` / `tf:plan:dev` / `tf:apply:dev` / `tf:destroy:dev` (and `:prod`) — when `terraform-aws` was selected; requires Terraform + AWS credentials. Do not apply in CI.

After CLI or template structure work, always verify a fresh scaffold of **default alone**. After feature overlays, run the checks that feature introduces. Report exact command output; do not claim a check passed without running it.
