# create-next-kit

An interactive Next.js starter-kit generator. Answer a few questions about your
dependencies and frontend architecture, and it scaffolds a clean App Router
project — no `create-next-app` boilerplate to delete afterwards.

```bash
# from this repo
npm install
npm start
# or scaffold straight away
node bin/cli.js my-app
```

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
node bin/cli.js my-app --yes              # accept all defaults
node bin/cli.js my-app --yes --no-install # scaffold without installing
node bin/cli.js my-app --yes --pm bun     # pick a package manager
node bin/cli.js my-app --yes --no-git     # skip git init
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

## Requirements

Node.js 18.18+ and at least one package manager on your PATH.
