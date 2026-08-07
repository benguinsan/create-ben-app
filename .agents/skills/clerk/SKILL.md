---
name: clerk
description: Clerk authentication overlay for create-my-custom-app (templates/clerk-auth) and generated Next.js App Router apps.
---

# Clerk auth skill

Use when adding, changing, or debugging **Clerk** in this repo’s CLI templates or a generated app that selected Auth → Clerk.

## Overlay layout (`templates/clerk-auth`)

Copied only when the user selects Clerk. Never bake into `templates/default`.

| Path | Role |
|------|------|
| `src/proxy.ts` | Next.js 16+ auth boundary (`clerkMiddleware` + matcher). Use `middleware.ts` only if Next ≤15. |
| `src/app/layout.tsx` | `ClerkProvider` **inside** `<body>`; header with `Show` / `SignInButton` / `SignUpButton` / `UserButton` |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | `<SignIn />` |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | `<SignUp />` |
| `src/app/dashboard/page.tsx` | Example protected page via `await auth.protect()` |
| `.env.example` | Clerk key placeholders |
| `package.json` | Merges `@clerk/nextjs` into the generated app |

## Env vars

| Variable | Exposure |
|----------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client + server |
| `CLERK_SECRET_KEY` | **Server only** |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Optional path (default `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Optional path (default `/sign-up`) |

Never commit real secrets. Never import `CLERK_SECRET_KEY` into client components.

## Rules

- Use `@clerk/nextjs`, not `@clerk/clerk-react`.
- `auth()` is async — always `await auth()`.
- Prefer resource-level protection (`auth.protect()` on pages / server actions / route handlers). Avoid deprecated `createRouteMatcher` for auth gates.
- Magic Links, MFA, Social Auth, Passkeys, Impersonation → configure in the **Clerk Dashboard**, not a second auth library.
- Keep UI minimal/unstyled unless a theme overlay styles it.

## Docs

- https://clerk.com/docs/nextjs/getting-started/quickstart
- https://clerk.com/docs/reference/nextjs/clerk-middleware
