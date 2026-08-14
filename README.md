<h1 align="center">
  create-my-custom-app
</h1>

<p align="center">
  Interactive CLI to scaffold a custom Next.js starter.
</p>

<p align="center">
  Get started by running <code>npx create-my-custom-app@latest my-app</code>
</p>

<div align="center">

[![PRs-Welcome][contribute-image]][contribute-url] [![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

</div>

## Table of contents

- <a href="#about">About</a>
- <a href="#getting-started">Getting Started</a>
- <a href="#options">Options</a>

<h2 id="about">About</h2>

`create-my-custom-app` is a CLI that generates a Next.js app from `templates/`. The default is a primitive [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) project (App Router, TypeScript, Tailwind). Optional pieces are overlays you opt into — skip them and you only get the default.

Each overlay is one folder, one tech. Unselected features are never copied. Generated files are yours to edit or delete.

Requires **Node.js 24+** and **npm**.

### Optional features

| Prompt | Choice |
| --- | --- |
| Auth | [Clerk](https://clerk.com) or none |
| Env validation | [T3 Env](https://env.t3.gg) + Zod or none |
| Linter / formatter | Oxlint + Oxfmt or ESLint (CNA default) |
| Docker | yes or no |

<h2 id="getting-started">Getting Started</h2>

Run one of these and answer the prompts:

### npm

```bash
npx create-my-custom-app@latest my-app
```

### yarn

```bash
yarn create my-custom-app my-app
```

### pnpm

```bash
pnpm create my-custom-app my-app
```

### bun

```bash
bun create my-custom-app my-app
```

Then:

```bash
cd my-app
npm install
npm run dev
```

<h2 id="options">Options</h2>

Skip prompts with flags (useful in CI):

```bash
npx create-my-custom-app my-app --auth none --env none --linter eslint --no-docker
```

| Flag | Values |
| --- | --- |
| `--auth` | `clerk` \| `none` |
| `--env` | `t3` \| `none` |
| `--linter` | `oxlint` \| `eslint` |
| `--docker` / `--no-docker` | include or skip Docker |

[downloads-image]: https://img.shields.io/npm/dm/create-my-custom-app?color=364fc7&logoColor=364fc7
[npm-url]: https://www.npmjs.com/package/create-my-custom-app
[npm-image]: https://img.shields.io/npm/v/create-my-custom-app?color=0b7285&logoColor=0b7285
[contribute-url]: https://github.com/benguinsan/create-ben-app
[contribute-image]: https://img.shields.io/badge/PRs-welcome-blue.svg
