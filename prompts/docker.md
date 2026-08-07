# Feature — Docker (container)

## Goal

Add optional **Docker** as an A-flat overlay: `templates/docker/`, interactive confirm **Would you like to use Docker?**, and scaffold merge so selecting Docker overlays onto `templates/default` (and any other selected features) without baking container files into the CNA primitive. Generated apps get a production-oriented multi-stage `Dockerfile`, `.dockerignore`, `output: "standalone"` in Next config, and clear next-step commands. Skipping Docker leaves no Docker files.

## Skills read

- No Docker skill in `AGENTS.md` §3 — **do not invent** `.agents/skills/docker`.
- Official Next.js Docker guidance: `output: "standalone"` + multi-stage Dockerfile (Vercel `examples/with-docker` pattern).
- `AGENTS.md` §6 Container, §8 Docker row, §9 scaffolding (Docker confirm wording).

## Existing code inspected

- `AGENTS.md` — Docker = confirm yes/no → `templates/docker`; never copy when skipped; production `Dockerfile` + `.dockerignore` + short notes; optional Compose only if needed; not in `default`.
- `src/index.ts` — intro → project name → Auth select → scaffold; next-steps Auth-aware; no Docker prompt/flag yet.
- `src/scaffold.ts` — copies `default`, overlays `FeatureId[]` (`"clerk-auth"` only today); merges `package.json`; text extensions list (no bare `Dockerfile` / `.dockerignore` special-case — binary `copyFile` is OK if no placeholders).
- `templates/default/` — Next.js 16.3, Node `>=24`, `next.config.ts` without `output`; no Docker files.
- `templates/docker/` — does not exist.
- `templates/clerk-auth/` — existing overlay pattern (files + `package.json` merge + README overwrite).
- Prior prompt `prompts/clerk-auth.md` — Auth opt-in pattern to mirror for Docker confirm + flag.

## Decisions / assumptions

1. **Interactive prompt:** after Auth (and before scaffold), ask via `@clack/prompts` `confirm`:
   - message: **Would you like to use Docker?**
   - `initialValue: false` (opt-in)
   - yes → include `docker` overlay; no → skip  
   Cancel → cancel message + exit non-zero.
2. **Non-interactive / CI:** support `--docker` (force yes) and `--no-docker` (force no). When not a TTY and neither flag is set, default to **no** Docker (same spirit as Auth → none). Log a dim summary when flag-driven.
3. **Scaffold:** extend `FeatureId` with `"docker"`. Copy `default`, then overlay selected features in stable order: `clerk-auth` (if any) then `docker` (if any). Same placeholders (`{{name}}`, `{{description}}`).
4. **Overlay contents (isolatable):**
   - `Dockerfile` — multi-stage (deps → builder → runner), Node **24** (match `engines.node`), npm, production standalone runner (`node server.js`), non-root `node` user, `PORT=3000`, `HOSTNAME=0.0.0.0`, `EXPOSE 3000`. Prefer slim/official Node image aligned with Next.js with-docker guidance (not Alpine-only dogma — slim is fine). No secrets baked in.
   - `.dockerignore` — exclude `node_modules`, `.next`, `.git`, env files (`.env*`), README noise as appropriate, IDE folders, tests if any, Docker itself where useful.
   - `next.config.ts` — set `output: "standalone"` (overwrite default config; keep TypeScript `NextConfig` shape). Required for the official small-image pattern.
   - `package.json` fragment — optional convenience scripts only, e.g. `docker:build` / `docker:run` (or document in next-steps only). Prefer minimal scripts that call `docker build` / `docker run` with sensible tags (`{{name}}` or fixed `app`). No new runtime npm dependencies.
   - **Do not** ship `docker-compose.yml` in v1 — single Next.js app; Compose not required for this overlay.
   - **Do not** overwrite `README.md` in the docker overlay (avoids clobbering Clerk/default README when multiple features are selected). Put short usage notes in CLI **next-steps** when Docker is selected (and brief comments at the top of `Dockerfile` if helpful).
5. **Next-steps:** when Docker selected, append Docker build/run steps (e.g. `docker build -t <name> .` and `docker run -p 3000:3000 <name>`), plus reminder that local `npm run dev` still works without Docker. Keep Clerk env steps when Auth=Clerk.
6. **Scope of this slice:** Docker confirm + flag + `templates/docker` + scaffold `FeatureId` wiring only. Do not add Database / Sentry / other feature prompts. Do not invent a Docker skill file.
7. **Out of scope:** Compose stacks for Neon/Postgres, multi-arch build matrix, Kubernetes manifests, Bake/BuildKit advanced cache unless already trivial in the official example, putting Docker into `templates/default`.

## Files likely to change

| Path | Change |
|------|--------|
| `src/index.ts` | Docker confirm after Auth; `--docker` / `--no-docker`; pass `docker` in features; Docker-aware next steps |
| `src/scaffold.ts` | Add `"docker"` to `FeatureId` (text-extension tweaks only if placeholders needed in Dockerfile) |
| `templates/docker/**` | New: `Dockerfile`, `.dockerignore`, `next.config.ts` (`output: "standalone"`), optional `package.json` scripts |
| `templates/default/**` | **No** Docker files (must stay CNA-only) |
| `.agents/skills/**` | **No** new skill |

## Implementation requirements

1. Clack `confirm` with exact product wording; handle `isCancel`.
2. Only copy `templates/docker` when user confirms (or `--docker`).
3. Overlay must be isolatable: skip/delete folder ⇒ no Docker artifacts in generated apps.
4. Dockerfile must produce a runnable image for a stock default Next app after `npm` lockfile exists in the build context (Dockerfile should `npm ci` when `package-lock.json` present, else `npm install` — mirror official with-docker resilience if practical).
5. `next.config.ts` in overlay must enable standalone without breaking App Router / default template.
6. Do not put `@clack/prompts` / `picocolors` / `ora` into the generated app.
7. Do not bake secrets or `.env` into the image; `.dockerignore` must exclude `.env*`.

## Security requirements

- Run container as non-root (`USER node` or equivalent).
- Never `COPY` `.env`, `.env.local`, or credential files into the image.
- No privileged mode, no host network assumptions in docs.
- Document that runtime secrets are passed via `-e` / orchestrator env — not baked at build time (unless `NEXT_PUBLIC_*` truly required at build; default scaffold has none — keep build env-free).

## Acceptance criteria

- [ ] Answering **no** (or `--no-docker` / non-TTY default) scaffolds without `Dockerfile`, `.dockerignore`, or standalone `output` from the docker overlay.
- [ ] Answering **yes** (or `--docker`) produces `Dockerfile`, `.dockerignore`, and `next.config.ts` with `output: "standalone"`.
- [ ] `templates/default` remains free of Docker files and standalone output.
- [ ] Cancel during Docker confirm exits cleanly before scaffold write.
- [ ] Clerk-only and Clerk+Docker paths still work (docker overlay does not remove Clerk files; no README clobber from docker).
- [ ] CLI `npm run typecheck` / `npm run build` pass; smoke scaffold yes/no paths.

## Checks to run

From `create-my-custom-app/`:

```bash
npm run typecheck
npm run build
```

Smoke:

```bash
# Docker = no
node dist/index.js docker-skip-demo --auth none --no-docker
# confirm: no Dockerfile, no .dockerignore, next.config has no standalone from overlay

# Docker = yes
node dist/index.js docker-yes-demo --auth none --docker
# confirm: Dockerfile, .dockerignore, output standalone in next.config.ts
# next-steps mention docker build/run
```

Optional (requires Docker daemon):

```bash
cd docker-yes-demo && npm install && docker build -t docker-yes-demo . && docker run --rm -p 3000:3000 docker-yes-demo
# curl http://localhost:3000 → 200
```

## Exact manual test steps (after implementation)

1. `cd create-my-custom-app && npm run build`
2. `node dist/index.js docker-no-app --auth none` → answer **No** to Docker → no Docker overlay files; `next.config.ts` matches default (no `standalone`).
3. `node dist/index.js docker-yes-app --auth none` → answer **Yes** → confirm `Dockerfile`, `.dockerignore`, `output: "standalone"`, next-steps include build/run.
4. Cancel at Docker confirm → cancel message, non-zero exit, no project written (ask Docker before scaffold; abort before write).
5. `node dist/index.js docker-clerk-app --auth clerk --docker` → Clerk files + Docker files both present; README still Clerk’s (docker must not overwrite README).
6. Optional: in `docker-yes-app`, `npm install && docker build … && docker run …` and open port 3000.
