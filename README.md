# create-next-kit

An interactive Next.js starter-kit generator. Answer a few questions about your
dependencies and frontend architecture, and it scaffolds a clean App Router
project — no `create-next-app` boilerplate to delete afterwards.

## Quick start

You don't install it — run it with your package manager's runner. It scaffolds a
**new folder** in the current directory, so run it from where you want the
project to live:

```bash
# npm
npx @kent-caparas/create-next-kit my-app
npm create @kent-caparas/next-kit@latest my-app

# bun
bunx @kent-caparas/create-next-kit my-app
bun create @kent-caparas/next-kit my-app

# pnpm / yarn
pnpm create @kent-caparas/next-kit my-app
yarn create @kent-caparas/next-kit my-app
```

Then start the generated app:

```bash
cd my-app
npm run dev   # or bun / pnpm / yarn
```

With no flags it walks you through the questions below. It creates `./my-app` —
it does not scaffold into the folder you're already in (if that folder exists and
is non-empty, it refuses rather than overwrite).

## What it asks

1. **Project name**
2. **Language** — TypeScript or JavaScript
3. **Package manager** — npm / pnpm / yarn / bun (only installed ones are offered)
4. **Styling** — Tailwind CSS (v4) / CSS Modules / Vanilla CSS / styled-components
5. **Component library** — shadcn/ui (when Tailwind is chosen)
6. **Frontend architecture** — Feature-Based / Feature-Sliced Design / Atomic Design / Default
7. **State management** — none / Zustand / Redux Toolkit / Jotai
8. **Data fetching** — none / TanStack Query / SWR
9. **Linting & formatting** — ESLint + Prettier / Biome / none
10. **Extras** — Vitest + Testing Library, react-hook-form + zod, Motion, Husky + lint-staged, typed env

Then it generates the files, wires up providers, installs the matching
dependencies at their latest versions, and (optionally) initializes git.

## What you get

- **App Router** routing in a thin root-level `app/` directory.
- All source under `src/`, organized by the architecture you picked, each layer
  documented with its own `README.md` and example files.
- Providers (Redux/Jotai, TanStack Query/SWR, styled-components registry) already
  wired into the root layout — only when you select them.
- Tailwind v4 (+ shadcn/ui theme tokens) configured the modern, CSS-first way.
- A landing page that shows the exact stack you chose.

## Architectures

| Choice | `src/` layout |
| ------ | ------------- |
| Feature-Based | `features/*` modules + shared `components`, `hooks`, `lib` |
| Feature-Sliced Design | `shared → entities → features → widgets → views`, plus an `app` layer |
| Atomic Design | `components/{atoms,molecules,organisms,templates}` |
| Default | flat `components`, `hooks`, `lib`, `types` |

## Flags (non-interactive)

```bash
npx @kent-caparas/create-next-kit my-app --yes              # accept all defaults
npx @kent-caparas/create-next-kit my-app --yes --no-install # scaffold without installing
npx @kent-caparas/create-next-kit my-app --yes --pm bun     # pick a package manager
npx @kent-caparas/create-next-kit my-app --yes --no-git     # skip git init
```

## How it's built

| File | Responsibility |
| ---- | -------------- |
| `bin/cli.js` | executable entry point |
| `src/index.js` | orchestration: prompt → scaffold → git → install |
| `src/prompts.js` | the interactive questionnaire (`@clack/prompts`) |
| `src/dependencies.js` | answers → package lists, scripts, install commands |
| `src/architectures.js` | path/alias resolution + folder-structure generation |
| `src/templates.js` | content for every generated file |
| `src/scaffold.js` | writes all files and the project README |
| `src/utils.js` | filesystem + command helpers |

## Local development

Working on the generator itself (not just using it):

```bash
git clone https://github.com/kent-caparas/next-js-starter-kit.git
cd next-js-starter-kit
npm install

# run it straight from source
npm start -- my-app          # same as: node bin/cli.js my-app
node bin/cli.js my-app --yes # non-interactive

# make `create-next-kit` available globally while you iterate
npm link
create-next-kit my-app
```

## Requirements

Node.js 18.18+ and at least one package manager on your PATH.
