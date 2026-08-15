# {{name}}

{{description}}

This is a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
via **create-ben-app**, with optional **Clerk** authentication.

## Getting Started

1. Copy env vars and add Clerk keys from the [Clerk Dashboard](https://dashboard.clerk.com):

```bash
cp .env.example .env.local
```

2. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the header Sign in / Sign up
controls, or visit `/sign-in` and `/sign-up`. `/dashboard` requires a signed-in user.

## Authentication (Clerk)

- Publishable key: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (client + server)
- Secret key: `CLERK_SECRET_KEY` (**server only** — never expose to the browser)
- Boundary: `proxy.ts` (`clerkMiddleware`) for Next.js 16+
- Example protected page: `app/dashboard/page.tsx` (`auth.protect()`)

Magic Links, MFA, Social Auth, Passkeys, and User Impersonation are configured in the
Clerk Dashboard — not as a second auth system in this app.

## Learn More

- [Clerk + Next.js](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Next.js Documentation](https://nextjs.org/docs)
