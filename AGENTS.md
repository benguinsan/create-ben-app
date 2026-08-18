# AGENTS.md

You are a principal-level engineer working on **create-benguin-app** (GitHub repo `create-ben-app`): a custom starter-template CLI, not a deployed Next.js app.

```bash
npx create-benguin-app <project-name>
```

The CLI copies `templates/default`, then selected overlays, into a new folder. Entrypoint: `src/index.ts`. Scaffold engine: `src/scaffold.ts` (copy + `{{placeholders}}`). **`templates/` is the source of truth** for generated project structure.

## Precedence

- This file applies to the whole repository.
- A nested `AGENTS.md` (today: `templates/default/AGENTS.md` from create-next-app) applies to its subtree and may add narrower rules. Do not invent more nested `AGENTS.md` files.
- More specific instructions beat broader ones when they do not conflict with the user.
- Direct user instructions beat repository guidance unless they violate safety or tool constraints.
- This file is the source of truth for agent workflow and repository boundaries.
- `package.json`, source, and the actual tree are the source of truth for commands and implementation when this file is stale.

## Always / Ask first / Never

**Always:** inspect relevant source, templates, and `package.json`; keep `templates/default` equivalent to primitive `create-next-app@latest`; copy only selected overlays; run applicable checks; report exact commands and results (if a check was not run, say so).

**Ask first:** unclear scope; a new overlay folder; copying an official skill outside the Clerk Next.js inventory; anything in Out of scope.

**Never:** invent `.agents/skills/`, `.claude/skills/`, `SKILL.md`, or pointer files; put skills or optional tech in `templates/default`; create `templates/clerk-auth/app/`; invent a second CLI entrypoint; commit secrets; claim a command passed without running it; invent missing files, APIs, skills, or services.

## Workflow

1. Read applicable `AGENTS.md` files.
2. Inspect source, templates, package scripts, and official docs.
3. Ask a focused question only when necessary.
4. Create or update a prompt in `prompts/` (historical notes; this file wins if they conflict).
5. Request approval unless the user already approved the prompt or asked to implement immediately.
6. Implement only the approved scope. No unrelated refactors.
7. Run applicable checks. Do not claim a command passed unless it was run.
8. Report exact commands, results, and manual test steps.

## Architecture

- Always copy `templates/default` first. Copy selected `templates/<id>/` overlays after. Never copy unselected overlays.
- `templates/default` = primitive `create-next-app@latest` only (App Router, TypeScript, Tailwind, `@/*`, CNA linter). Do not put optional technologies there.
- One overlay folder = one independently removable technology. Keep overlays removable. Do not create `templates/features/` or full-combination templates.
- Generated templates must stay valid, runnable projects. Do not leave broken imports when an overlay is omitted.
- Use `{{placeholders}}` only where the scaffold engine substitutes them.
- CLI-only dependencies stay in this package. Do not put `@clack/prompts` or `picocolors` in generated apps unless that app itself needs a CLI.

## Feature catalog

Every optional feature is independently selectable. Skipped features are never copied. If all are skipped, output only `templates/default`. Do not silently add optional tooling.

Use `select` for technology choices and `confirm` for yes/no (Docker, Terraform). Flags already exist: `--auth clerk|none`, `--env t3|none`, `--linter oxlint|eslint`, `--docker` / `--no-docker`, `--terraform` / `--no-terraform`.

| Feature | Choice | Overlay | Rule |
|---|---|---|---|
| Auth | Clerk or none | `clerk-auth` | Plumbing and official Clerk Skills only; no auth pages. See Clerk. |
| Env validation | T3 Env + Zod or none | `t3-env` | Type-safe env validation; no agent skill. |
| Linter / formatter | Oxlint + Oxfmt or CNA ESLint | `oxlint-oxfmt` | Replaces CNA linting when selected. |
| Docker | yes or no confirm | `docker` | Docker files only when selected. |
| Terraform | yes or no confirm | `terraform-aws` | AWS (S3, EC2, CloudFront; `environment/dev` + `environment/prod`) only when selected. |

Do not list or scaffold overlays that are not in this repo and not wired in `src/scaffold.ts` (`FeatureId`). `rhf-zod` and `github-actions` are not implemented. This repo’s CI is `.github/workflows/ci.yml` (CLI `typecheck` + `build`), not a generated-app overlay.

## Skills

This CLI repo has **no root-level feature-skill catalog**. That does **not** prohibit vendored official Clerk Skills inside `templates/clerk-auth/`.

- Copy a vendor skill only when that vendor publishes an official skill. Copy it verbatim. Do not rewrite official skill content from memory.
- Clerk is currently the only approved overlay with official agent skills. They live under `templates/clerk-auth/.agents/skills/` and `.claude/skills/`. Inventory: `templates/clerk-auth/skills-lock.json` (Next.js only — do not add Expo, Swift, Vue, and similar unless the user asks).
- Other overlays must not contain agent skill folders unless the user explicitly approves a future official skill.
- Never put skills in `templates/default`.
- No official skill → official package docs only. For Next.js, use installed docs (`node_modules/next/dist/docs/` when present) or official docs matching the installed version.

## Clerk

`templates/clerk-auth` is plumbing only: `@clerk/nextjs`, `.env.example`, `proxy.ts`, README, `skills-lock.json`, official skills.

- Do not create `templates/clerk-auth/app/` or add `/sign-in`, `/sign-up`, `/dashboard`, or other auth UI to the overlay.
- Do not overwrite `templates/default/app/`.
- Auth UI is implemented **after scaffold** in the generated app using the copied official Clerk Skills. Start with `/clerk`. Use the [Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart).
- Keep `CLERK_SECRET_KEY` server-only. Only intentionally public Clerk values may use `NEXT_PUBLIC_*`.
- Do not create a second authentication system.
- Magic links, MFA, social auth, passkeys, organizations, billing, webhooks, impersonation, and testing go through the Clerk Dashboard and matching official skills — not a second overlay app.

## CLI

- Interactive UX: `@clack/prompts` (`select`, `confirm`, `text`, cancel via `isCancel`). Terminal color: `picocolors`. Long work: Clack spinner.
- Handle cancel cleanly. Exit non-zero on cancellation or failure when appropriate.
- Preserve existing non-interactive flags. Keep prompt wording, overlay mapping, and next-step caveats consistent.
- Keep CLI dependencies in this package only (see Architecture).

## Generated apps

- Generated apps: Node.js **24+** and npm (`templates/default` `engines`). This CLI package: Node.js **>=20** (`package.json` `engines`); this repo’s CI uses Node 24.
- Stay TypeScript-aligned with current CNA versions.
- Respect server/client boundaries. Secrets and privileged writes stay on the server.
- Prefer Server Components for reads and thin Server Actions or route handlers for mutations. Keep route handlers thin.
- Use T3 Env as the canonical env module when that overlay is selected. Use React Hook Form and Zod only if that overlay exists and was selected.

## Security

- Never commit real secrets or API keys. Document variables in `.env.example`.
- Server secrets stay server-only. Never expose Clerk secret keys to browser code.
- Do not perform privileged operations from browser code.
- Validate inputs at boundaries. Do not hardcode connection strings or credentials.
- Do not add third-party services outside the approved stack without explicit user approval.

## Out of scope

Do not scaffold unless the user explicitly requests: i18n; PGlite / SQLite / MySQL multi-dialect; Vitest, Playwright, Storybook, visual regression, Codecov; local git hooks; Semantic Release, Checkly, Knip, Commitizen, and similar; multi-tenancy, RBAC, Enterprise SSO/SAML/OIDC; Web3; a separate backend framework; heavy UI kits; extra SEO scaffolds; any other unrequested feature.

An official Clerk skill may still copy when Clerk is selected even if it documents an out-of-scope capability. Copying a skill does not enable or scaffold that capability.

## Prompts

`prompts/` files are historical. Ignore a prompt that asks for `templates/clerk-auth/app/`, invented skills, or `.agents/` on a stack with no official vendor skill.

Superseded (do not re-execute): `prompts/clerk-auth.md`, `prompts/clerk-auth-drop-app.md`, `prompts/skills-into-generated-app.md`.

Each new prompt should include: goal, skills/docs read, code inspected, decisions, files likely to change, requirements, security, acceptance criteria, checks, and exact manual test steps (plus Clack/picocolors/UX notes for CLI work).

## Commands

Verify against `package.json` before documenting new scripts. Do not claim a command exists merely because it is desirable.

### CLI package

```bash
npm run build
npm run typecheck
npm run dev
node dist/index.js smoke-app
npx create-benguin-app <project-name>
```

### Generated app

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
```

Feature-only (when selected): Oxlint `npm run format`; Docker `npm run docker:up` / `docker:down`; Terraform `npm run tf:init:dev` / `tf:plan:dev` / `tf:apply:dev` / `tf:destroy:dev` (and `:prod`). Do not apply Terraform in CI. Generated apps have no `typecheck` script unless an overlay adds one.
