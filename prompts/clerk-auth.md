# Feature — Authentication (Clerk)

## Goal

Add optional **Clerk authentication** as an A-flat overlay: `templates/clerk-auth/`, interactive Auth select (Clerk **or** none), and scaffold merge so selecting Clerk overlays onto `templates/default` without baking auth into the CNA primitive. Generated apps get minimal Sign in / Sign up / Sign out UI, middleware/proxy protection hooks, `.env.example` keys, and next-step caveats. Skipping Auth leaves a pure `default` scaffold.

## Skills read

- `.agents/skills/clerk` — **missing** in repo; treat as create-on-implement (thin skill summarizing overlay conventions + Clerk Next.js rules). Do not invent other skills.
- Clerk docs (manual): Next.js quickstart / `clerkMiddleware`, `ClerkProvider`, `Show` / `SignInButton` / `SignUpButton` / `UserButton`; Next.js 16+ uses `proxy.ts` (same body as legacy `middleware.ts`).
- `AGENTS.md` §8 Auth row, §11 Authentication (Clerk), §14 secrets table.

## Existing code inspected

- `AGENTS.md` — Auth = Clerk or none → `templates/clerk-auth`; never copy when skipped; 1 folder = 1 tech; secret keys server-only.
- `src/index.ts` — intro → project name → scaffold `default` only; no feature prompts yet; next-steps note is `cd` / `npm install` / `npm run dev`.
- `src/scaffold.ts` — copies `templates/default` + `{{name}}` / `{{description}}`; no feature overlay or `package.json` merge.
- `templates/default/` — Next.js 16.3 App Router, TS, Tailwind, `src/`; no Clerk.
- `templates/clerk-auth/` — does not exist.
- Prior prompts (`cli-project-name.md`, `templates-default-cna.md`) — name + default CNA only; this slice adds Auth opt-in.

## Decisions / assumptions

1. **Interactive prompt (Auth only in this slice):** after project name, ask Auth via `@clack/prompts` `select` (or equivalent):
   - **Clerk** → include `clerk-auth` overlay
   - **None** → skip overlay  
   Non-interactive / CI: `--auth clerk` or `--auth none` (defaults to none when not a TTY).
   Do **not** add Database / Sentry / other feature prompts yet (keep scope to authentication). Cancel → cancel message + exit non-zero.
2. **Scaffold:** copy `default`, then if Clerk selected copy/merge `templates/clerk-auth` on top with the same placeholders. Overlay files overwrite same relative paths. For `package.json`, **deep-merge** `dependencies` / `devDependencies` / `scripts` (and preserve `name` / `description` / `engines` from the already-substituted default). Do not leave broken Clerk imports when Auth is None.
3. **Next.js 16:** default template uses `next@16.3.0` → auth boundary file is `src/proxy.ts` exporting `clerkMiddleware()` + Clerk matcher `config` (not `middleware.ts`).
4. **Provider placement:** `ClerkProvider` wraps app content **inside** `<body>`, not around `<html>`.
5. **Minimal UI:** header (or equivalent) with `Show` + `SignInButton` / `SignUpButton` when signed out and `UserButton` when signed in. Unstyled / lightly utilitarian — no theme kit, no second auth system.
6. **Routes:** include App Router catch-all (or dedicated) pages for Clerk-hosted UI where needed, e.g. `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx` using `<SignIn />` / `<SignUp />`, plus optional example protected page (e.g. `src/app/dashboard/page.tsx`) that `await auth()` / `auth.protect()` so developers see the pattern. Protect `/dashboard` via `createRouteMatcher` + `auth.protect()` in `proxy.ts` (or document `auth.protect` on the page — prefer middleware/proxy matcher for the example).
7. **Env:** ship `.env.example` in the overlay with placeholders only:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=`
   - `CLERK_SECRET_KEY=`
   - optional path hints: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`  
   Never ship real keys or `.env.local` with secrets.
8. **Dependency:** pin/add latest stable `@clerk/nextjs` appropriate for Next 16 (v7+ if that is current). Overlay `package.json` fragment or full merge source only for auth deps — prefer a `package.json` in `clerk-auth` that merges cleanly.
9. **Extended Clerk capabilities** (Magic Links, MFA, Social, Passkeys, Impersonation): enabled in Clerk Dashboard / product config — do **not** scaffold custom flows or a second auth library. Mention in overlay README snippet or generated next-steps that those are configured in Clerk.
10. **Caveats / next steps** when Clerk selected: copy `.env.example` → `.env.local`, create a Clerk app, paste keys, `npm install`, `npm run dev`. When None, keep existing three-line next steps.
11. **Skill file:** create `.agents/skills/clerk/SKILL.md` (thin) documenting overlay layout, env vars, `proxy.ts` rule, and “dashboard-configured” extended auth — so future agents have the listed skill path.
12. **Out of scope:** T3 Env wiring, Drizzle/Neon, other feature multiselect, Lefthook, theme, installing the global `clerk` CLI into generated apps, running `clerk init` inside templates.

## Files likely to change

| Path | Change |
|------|--------|
| `src/index.ts` | Auth select after name; pass selected features into scaffold; Clerk-aware next steps |
| `src/scaffold.ts` | Accept feature ids; overlay copy; `package.json` merge |
| `templates/clerk-auth/**` | New overlay: `proxy.ts`, layout/header pieces, sign-in/up routes, optional dashboard, `.env.example`, package fragment, short README section |
| `.agents/skills/clerk/SKILL.md` | New thin skill |
| `templates/default/**` | **No** Clerk code (must stay CNA-only) |

## Implementation requirements

1. Clack Auth prompt with clear labels; handle `isCancel`.
2. Scaffold API e.g. `features: string[]` or `auth: "clerk" \| "none"`; only copy `clerk-auth` when Clerk chosen.
3. Overlay must be isolatable: deleting the feature folder / skipping prompt removes all auth files from generated apps.
4. TypeScript strict; no `any`; `@/` imports consistent with default.
5. README or next-steps must not claim auth is always installed.
6. Do not put `@clack/prompts` / `picocolors` into the generated app.

## Security requirements

- `CLERK_SECRET_KEY` server-only; never import into client components.
- Only `NEXT_PUBLIC_*` Clerk values on the client.
- No committed secrets; `.env.example` empty placeholders only.
- Route protection example must use Clerk server helpers (`auth` / `auth.protect`), not homemade JWT parsing.
- Do not add a second auth system alongside Clerk.

## Acceptance criteria

- [ ] Selecting **None** scaffolds only `templates/default` (no `@clerk/nextjs`, no `proxy.ts` from Clerk, no sign-in routes).
- [ ] Selecting **Clerk** produces overlay files + `@clerk/nextjs` in generated `package.json` + `.env.example` with Clerk vars.
- [ ] Generated Clerk app has `ClerkProvider` inside `<body>`, auth controls, sign-in/sign-up routes, and `src/proxy.ts` with `clerkMiddleware`.
- [ ] Cancel during Auth prompt exits cleanly.
- [ ] `templates/default` unchanged regarding auth (no Clerk deps).
- [ ] CLI `npm run build` / typecheck pass; smoke scaffold both paths.

## Checks to run

From `create-my-custom-app/`:

```bash
npm run typecheck
npm run build
```

Smoke (interactive or scripted):

```bash
# Auth = None
node dist/index.js auth-none-demo
# confirm no clerk files / no @clerk/nextjs

# Auth = Clerk (choose Clerk at prompt)
node dist/index.js auth-clerk-demo
# confirm proxy.ts, sign-in/up, .env.example, @clerk/nextjs in package.json
```

Optional inside Clerk-generated app (needs real keys for full auth UI):

```bash
cd auth-clerk-demo && npm install
# copy .env.example → .env.local and paste Clerk keys, then:
npm run build   # may require keys; if build fails without keys, document that
```

## Exact manual test steps (after implementation)

1. `cd create-my-custom-app && npm run build`
2. `node dist/index.js auth-skip-app` → choose **None** for Auth → confirm folder has no Clerk overlay; `package.json` has no `@clerk/nextjs`.
3. `node dist/index.js auth-clerk-app` → choose **Clerk** → confirm:
   - `src/proxy.ts` with `clerkMiddleware`
   - sign-in / sign-up routes
   - `.env.example` lists Clerk keys
   - `package.json` includes `@clerk/nextjs`
   - next-steps mention env + Clerk dashboard
4. Cancel at Auth prompt → cancel message, non-zero exit, no partial project (or clean abort before write — prefer abort before scaffold if Auth asked first after name).
5. With Clerk keys in `.env.local`, `npm install && npm run dev` → open `/`, use Sign up / Sign in, hit `/dashboard` signed-out (redirect/protect) and signed-in (ok).
