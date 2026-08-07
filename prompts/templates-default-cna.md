# Templates — reset `default` to primitive create-next-app

## Goal

Fill `templates/default/` with a **primitive Next.js app** equivalent to `npx create-next-app@latest` (TypeScript, Tailwind, App Router, `@/*`). Do **not** include Oxlint, T3 Env, RHF, custom theme, extra SEO, or other non-CNA tooling. Keep CLI scaffold working with `{{name}}` / `{{description}}` placeholders.

## Skills read

- None (CNA baseline; peek `node_modules/next/dist/docs/` after scaffold if needed)

## Existing code inspected

- `AGENTS.md` — `default` = CNA primitive only; extras are opt-in overlays
- `templates/default/` — currently **empty**
- `src/scaffold.ts` — copies `templates/default` and substitutes `{{name}}` / `{{description}}`

## Decisions / assumptions

1. Regenerate via `npx create-next-app@latest` into `templates/default` (or temp then move).
2. Prefer CNA recommended defaults: TS, Tailwind, App Router, `src/`, `@/*`, Turbopack if CNA default; use CNA’s default linter (ESLint), not Oxlint.
3. After scaffold: set `package.json` `name`/`description` (and README title if present) to `{{name}}` / `{{description}}` for CLI substitution. Put placeholders only in **strings** in TSX.
4. Remove `node_modules` and `.next` from the template before finishing; do not commit install artifacts.
5. `engines` Node 24+ optional; keep aligned with AGENTS if easy.
6. Out of scope: feature folders, interactive multiselect, fat stack from prior default.

## Files likely to change

| Path | Change |
|------|--------|
| `templates/default/**` | Full CNA-shaped app |

## Acceptance criteria

- [ ] `templates/default` has Next.js app files (not empty)
- [ ] No Oxlint/Ultracite/T3 Env/RHF in default `package.json`
- [ ] `node dist/index.js demo-app` produces a non-empty project with substituted name
- [ ] Generated app can `npm install && npm run build` after scaffold

## Checks to run

```bash
npm run build   # CLI package
# scaffold smoke + npm install && npm run build inside generated app
```

## Exact manual test steps

1. `npm run build` in CLI package
2. From temp dir: `node <repo>/dist/index.js cna-demo`
3. Confirm `cna-demo/package.json` name is `cna-demo` and deps look like CNA
4. `cd cna-demo && npm install && npm run build`
