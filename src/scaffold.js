import { getPaths, scaffoldArchitecture } from "./architectures.js";
import * as t from "./templates.js";
import { writeProjectFile } from "./utils.js";

/** Whether the app needs a client `<Providers>` wrapper in the root layout. */
export function needsProviders(a) {
  return (
    a.data !== "none" ||
    a.state === "redux" ||
    a.state === "jotai" ||
    a.styling === "styled-components"
  );
}

/**
 * Write every file for the project. Does not install or run git — the caller
 * handles those after files are on disk.
 */
export async function scaffold(root, a, plan) {
  const paths = getPaths(a);
  const isTS = a.language === "ts";
  const x = isTS ? "tsx" : "jsx";
  const m = isTS ? "ts" : "js";

  await writePackageJson(root, a, plan);

  // ── base config ──────────────────────────────────────────────────────
  await writeProjectFile(root, ".gitignore", t.gitignore());
  await writeProjectFile(root, ".env.example", t.envExample());
  if (isTS) {
    await writeProjectFile(root, "tsconfig.json", t.tsconfig());
    await writeProjectFile(root, "next-env.d.ts", t.nextEnv());
    await writeProjectFile(root, "next.config.ts", t.nextConfig(a));
  } else {
    await writeProjectFile(root, "jsconfig.json", t.jsconfig());
    await writeProjectFile(root, "next.config.mjs", t.nextConfig(a));
  }

  // ── styling ──────────────────────────────────────────────────────────
  if (a.styling === "tailwind") {
    await writeProjectFile(root, "postcss.config.mjs", t.postcssConfig());
  }
  await writeProjectFile(root, paths.stylesFile, t.globalsCss(a));

  // ── linting & formatting ─────────────────────────────────────────────
  if (a.linting === "eslint-prettier") {
    await writeProjectFile(root, "eslint.config.mjs", t.eslintConfig(a));
    await writeProjectFile(root, ".prettierrc", t.prettierrc(a));
    await writeProjectFile(root, ".prettierignore", t.prettierignore());
  } else if (a.linting === "biome") {
    await writeProjectFile(root, "biome.json", t.biomeJson());
  }

  // ── App Router ───────────────────────────────────────────────────────
  await writeProjectFile(root, `app/layout.${x}`, t.rootLayout(a, paths, needsProviders(a)));
  await writeProjectFile(root, `app/page.${x}`, t.homePage(a, paths));
  if (a.styling === "css-modules") {
    await writeProjectFile(root, "app/page.module.css", t.pageModuleCss());
  }

  // ── providers ────────────────────────────────────────────────────────
  if (needsProviders(a)) {
    await writeProjectFile(root, paths.providersFile, t.providersComponent(a, paths));
  }
  if (a.styling === "styled-components") {
    await writeProjectFile(root, paths.registryFile, t.styledRegistry(a));
  }

  // ── shadcn/ui foundation ─────────────────────────────────────────────
  if (a.ui === "shadcn") {
    await writeProjectFile(root, "components.json", t.componentsJson(a, paths));
    await writeProjectFile(root, paths.cnFile, t.cnUtil(a));
    await writeProjectFile(root, `${paths.uiDir}/button.${x}`, t.buttonComponent(a, paths));
  }

  // ── state management ─────────────────────────────────────────────────
  if (a.state === "zustand") {
    await writeProjectFile(root, `${paths.storeDir}/use-counter-store.${m}`, t.zustandStore(a));
  } else if (a.state === "redux") {
    await writeProjectFile(root, `${paths.storeDir}/index.${m}`, t.reduxStore(a));
    await writeProjectFile(root, `${paths.storeDir}/counter-slice.${m}`, t.reduxSlice());
    if (isTS) await writeProjectFile(root, `${paths.storeDir}/hooks.${m}`, t.reduxHooks());
  } else if (a.state === "jotai") {
    await writeProjectFile(root, `${paths.storeDir}/atoms.${m}`, t.jotaiAtoms());
  }

  // ── extras ───────────────────────────────────────────────────────────
  if (a.extras.includes("env")) {
    await writeProjectFile(root, paths.envFile, t.envFile());
  }
  if (a.extras.includes("vitest")) {
    await writeProjectFile(root, isTS ? "vitest.config.ts" : "vitest.config.mjs", t.vitestConfig(a));
    await writeProjectFile(root, `vitest.setup.${m}`, t.vitestSetup());
    await writeProjectFile(root, `src/__tests__/example.test.${x}`, t.sampleTest());
  }
  if (a.extras.includes("husky")) {
    await writeProjectFile(root, ".husky/pre-commit", t.huskyPreCommit(a));
  }

  // ── architecture folders, barrels, READMEs, examples ─────────────────
  await scaffoldArchitecture(root, a);

  // ── project README ───────────────────────────────────────────────────
  await writeProjectFile(root, "README.md", projectReadme(a, plan));

  return paths;
}

async function writePackageJson(root, a, plan) {
  const pkg = {
    name: a.projectName,
    version: "0.1.0",
    private: true,
    scripts: plan.scripts,
  };

  const lintStaged = t.lintStagedConfig(a);
  if (a.extras.includes("husky") && lintStaged) {
    pkg["lint-staged"] = lintStaged;
  }

  // When we are not installing, embed the dependency lists so the user can run
  // their own install later. When we are installing, the package manager's
  // `add` commands write properly-pinned versions for us.
  if (!a.install) {
    pkg.dependencies = Object.fromEntries(plan.dependencies.map((d) => [d, "latest"]));
    pkg.devDependencies = Object.fromEntries(plan.devDependencies.map((d) => [d, "latest"]));
  }

  await writeProjectFile(root, "package.json", JSON.stringify(pkg, null, 2));
}

function projectReadme(a, plan) {
  const rows = t
    .stackData(a)
    .map(([label, value]) => `| ${label} | ${value} |`)
    .join("\n");

  const scriptRows = Object.entries(plan.scripts)
    .map(([name, cmd]) => `| \`${a.packageManager} run ${name}\` | ${cmd} |`)
    .join("\n");

  const pm = a.packageManager;
  const installNote = a.install
    ? ""
    : `\n> Dependencies were **not** installed. Run \`${pm} install\` before starting.\n`;

  const usage = libraryUsage(a);

  return `# ${a.projectName}

Generated with **create-next-kit** — a clean Next.js App Router project with no
boilerplate cruft.

## Stack

| Area | Choice |
| ---- | ------ |
${rows}

## Getting started
${installNote}
\`\`\`bash
${pm} run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Runs |
| ------- | ---- |
${scriptRows}

## Project structure

Routing lives in the root-level \`app/\` directory (Next.js App Router). All other
source lives in \`src/\`, organized per the **${t.stackData(a)[1][1]}** architecture.
See [\`src/README.md\`](./src/README.md) for the full layout and import rules.
${usage}`;
}

function libraryUsage(a) {
  const blocks = [];

  if (a.state === "zustand") {
    blocks.push(`### State — Zustand

\`\`\`tsx
import { useCounterStore } from "@/store/use-counter-store";

const count = useCounterStore((s) => s.count);
\`\`\``);
  } else if (a.state === "redux") {
    blocks.push(`### State — Redux Toolkit

\`\`\`tsx
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { increment } from "@/store/counter-slice";

const value = useAppSelector((s) => s.counter.value);
const dispatch = useAppDispatch();
dispatch(increment());
\`\`\``);
  } else if (a.state === "jotai") {
    blocks.push(`### State — Jotai

\`\`\`tsx
import { useAtom } from "jotai";
import { counterAtom } from "@/store/atoms";

const [count, setCount] = useAtom(counterAtom);
\`\`\``);
  }

  if (a.data === "tanstack-query") {
    blocks.push(`### Data — TanStack Query

The \`QueryClientProvider\` is wired up in the root layout. Use \`useQuery\` in any
client component. Devtools are enabled in development.`);
  } else if (a.data === "swr") {
    blocks.push(`### Data — SWR

\`SWRConfig\` is wired up in the root layout. Use \`useSWR\` in any client component.`);
  }

  if (a.ui === "shadcn") {
    blocks.push(`### UI — shadcn/ui

A \`Button\` is included. Add more components with:

\`\`\`bash
npx shadcn@latest add card input dialog
\`\`\``);
  }

  return blocks.length ? `\n## Using the stack\n\n${blocks.join("\n\n")}\n` : "\n";
}
