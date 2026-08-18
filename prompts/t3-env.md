# Feature — T3 Env + Zod (type-safe environment variables)

> **Current (skills):** T3 Env has **no** official agent skill. Do **not** add `templates/t3-env/.agents/`. Use [env.t3.gg/docs/nextjs](https://env.t3.gg/docs/nextjs). `AGENTS.md` §3.

## Goal

Add optional **T3 Env + Zod** as an A-flat overlay: `templates/t3-env/`, interactive Env validation choice (**T3 Env + Zod** **or** none), and scaffold merge so selecting T3 Env overlays onto `templates/default` (and any other selected features). Generated apps get `src/env.ts` validated with `@t3-oss/env-nextjs`, `.env.example` as the canonical env list, and build-time validation via `next.config.ts`. Skipping leaves no T3 Env deps or `src/env.ts`.

## Skills read

- No `t3-env` skill file exists under `.agents/skills/` — use [T3 Env Next.js docs](https://env.t3.gg/docs/nextjs) and project patterns.
- `AGENTS.md` §6 Config, §8 Env validation row, §13 Secrets and environment variables.

## Existing code inspected

- `AGENTS.md` — Env validation = T3 Env + Zod **or** none → `templates/t3-env`; not in `default`; extend schemas when Clerk overlay is also selected.
- `src/index.ts` — Auth → Linter → Docker prompts; no env prompt/flag yet.
- `src/scaffold.ts` — `FeatureId` = `"clerk-auth" | "oxlint-oxfmt" | "docker"`; overlay copy + `package.json` merge + `.scaffold-rm`.
- `templates/default/` — CNA primitive; no `src/env.ts`.
- `templates/clerk-auth/` — `.env.example` with Clerk keys; no T3 Env module.
- `templates/docker/` — `next.config.ts` with `output: "standalone"`; copied before T3 Env in stable order so T3 can merge env import + conditional standalone.

## Decisions / assumptions

1. **Interactive prompt:** after Auth and **before** Linter, ask via `@clack/prompts` `select`:
   - message: **Environment variable validation?**
   - options: **T3 Env + Zod** / **None**
   - `initialValue: "none"` (opt-in)
2. **Non-interactive / CI:** `--env t3` and `--env none` (also `--env=t3`). Default **none** when not a TTY. Invalid values → error + exit 1.
3. **Scaffold:** extend `FeatureId` with `"t3-env"`. Overlay order: `clerk-auth` → `oxlint-oxfmt` → `docker` → `t3-env` (T3 `next.config.ts` wins last; includes conditional `standalone` when `Dockerfile` exists).
4. **Clerk + T3 combo:** when both selected, post-copy swap `src/env.ts` and `.env.example` from `env.with-clerk.ts` / `.env.example.with-clerk` variants in `templates/t3-env/`.
5. **Overlay contents:**
   - `src/env.ts` — `createEnv` with `NODE_ENV` (minimal CNA-safe baseline)
   - `src/env.with-clerk.ts` — same + Clerk server/client keys
   - `.env.example` / `.env.example.with-clerk`
   - `next.config.ts` — `import "./src/env"`; `transpilePackages`; `output: "standalone"` when `Dockerfile` present
   - `package.json` — `@t3-oss/env-nextjs`, `zod`
6. **Next-steps:** when T3 selected, mention `cp .env.example .env.local`, editing `src/env.ts` for new vars, and importing `env` instead of `process.env`.

## Acceptance criteria

- [ ] **None** / `--env none` scaffolds without `src/env.ts`, T3 deps, or env import in `next.config.ts`.
- [ ] **T3 Env** / `--env t3` produces `src/env.ts`, `.env.example`, deps, and build-time validation.
- [ ] Clerk + T3 produces combined env schema and `.env.example`.
- [ ] T3 + Docker keeps `output: "standalone"` via conditional check in T3 `next.config.ts`.
- [ ] CLI `npm run typecheck` / `npm run build` pass.
