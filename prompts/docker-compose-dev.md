# Fix — Docker overlay for Compose live reload

## Goal

Re-check `templates/docker` after the local rewrite from a production standalone image to a **Compose + `next dev`** overlay, fix Next.js-specific bugs, and republish `create-benguin-app` so `npx create-benguin-app@latest` ships the working overlay.

## Skills read

- No Docker skill in `AGENTS.md` §3 — do not invent `.agents/skills/docker`.
- `AGENTS.md` §6 Container: optional Compose is allowed; overlay only when selected; do not bake Docker into `default`.

## Existing code inspected

- `templates/docker/Dockerfile` (uncommitted rewrite) — Vite-style `EXPOSE 5173`, Node `22.17.0-alpine`, required `package-lock.json`, `npm run dev`.
- `templates/docker/compose.yaml` (untracked) — bind mounts + anonymous `node_modules` / `.next` volumes; required `.env.local`; port 5173.
- `templates/docker/docker-entrypoint.sh` (untracked) — root → `su-exec node` after chown of `.next`.
- `templates/docker/package.json` — `docker:run` maps `3000:3000` (mismatch).
- `templates/docker/next.config.ts` — still `output: "standalone"` (harmless for `next dev`; keep for T3 overlay).
- `templates/default/package.json` — Next.js 16.3, `engines.node >=24`, no lockfile in the template.
- `src/index.ts` — next-steps still describe a production image (`docker:build` / `docker:run`).

## Decisions or assumptions

1. Honor the user’s Compose/live-reload direction (do **not** restore the old multi-stage production Dockerfile).
2. Align with this starter: **Node 24**, **port 3000**, optional lockfile (`npm ci` or `npm install`).
3. Drop required `env_file: .env.local` (Compose fails when the file is missing; bind-mount already lets Next.js load it).
4. Add polling env vars so file watching works on Docker Desktop.
5. Add `docker:up` / `docker:down` scripts and update CLI next-steps.
6. Bump package version `0.1.0` → `0.1.1` and `npm publish` so npx `@latest` picks it up.

## Files likely to change

| Path | Change |
|------|--------|
| `templates/docker/Dockerfile` | Node 24 alpine, port 3000, optional lockfile, `libc6-compat` |
| `templates/docker/compose.yaml` | Port 3000, no required env_file, watch polling |
| `templates/docker/docker-entrypoint.sh` | Keep permission drop; trailing newline |
| `templates/docker/package.json` | Compose scripts; run port 3000 |
| `src/index.ts` | Next-steps for Compose |
| `package.json` | Version 0.1.1 |

## Implementation requirements

- Overlay remains opt-in (`--docker` / confirm). Isolatable; no README overwrite.
- No secrets baked into the image; `.dockerignore` keeps `.env*`.
- Generated app uses Next.js default port **3000**.

## Security requirements

- Entrypoint drops to `node` (non-root) via `su-exec`.
- Do not copy `.env` / `.env.local` into the image.

## Acceptance criteria

- [ ] Docker overlay files are consistent (Node 24, port 3000, optional lockfile).
- [ ] `compose.yaml` does not require `.env.local`.
- [ ] CLI next-steps mention `docker compose up` / `docker:up`.
- [ ] CLI `typecheck` + `build` pass; smoke scaffold with `--docker` includes the overlay.
- [ ] `create-benguin-app@0.1.1` is published to npm.

## Checks to run

```bash
npm run typecheck
npm run build
node dist/index.js docker-compose-smoke --auth none --env none --linter eslint --docker --no-terraform
```

Confirm generated folder has `Dockerfile`, `compose.yaml`, `docker-entrypoint.sh`, port 3000.

## Exact manual test steps expected after implementation

1. `npx create-benguin-app@latest docker-demo --auth none --env none --linter eslint --docker --no-terraform`
2. `cd docker-demo && npm run docker:up`
3. Open http://localhost:3000
4. `npm run docker:down`
