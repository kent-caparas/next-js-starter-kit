/**
 * Translate the user's answers into concrete package lists and npm scripts.
 * Versions are intentionally omitted — the installer pulls the latest that
 * satisfies the peer requirements, keeping the kit current over time.
 */
export function resolvePlan(answers) {
  const deps = new Set(["next", "react", "react-dom"]);
  const dev = new Set();
  const scripts = {
    dev: "next dev",
    build: "next build",
    start: "next start",
  };

  if (answers.language === "ts") {
    dev.add("typescript");
    dev.add("@types/node");
    dev.add("@types/react");
    dev.add("@types/react-dom");
  }

  // ── Styling ────────────────────────────────────────────────────────────
  if (answers.styling === "tailwind") {
    dev.add("tailwindcss");
    dev.add("@tailwindcss/postcss");
    dev.add("postcss");
  } else if (answers.styling === "styled-components") {
    deps.add("styled-components");
  }

  // ── UI library ─────────────────────────────────────────────────────────
  if (answers.ui === "shadcn") {
    deps.add("class-variance-authority");
    deps.add("clsx");
    deps.add("tailwind-merge");
    deps.add("lucide-react");
    deps.add("@radix-ui/react-slot");
    dev.add("tw-animate-css");
  }

  // ── State management ───────────────────────────────────────────────────
  if (answers.state === "zustand") deps.add("zustand");
  else if (answers.state === "redux") {
    deps.add("@reduxjs/toolkit");
    deps.add("react-redux");
  } else if (answers.state === "jotai") deps.add("jotai");

  // ── Data fetching ──────────────────────────────────────────────────────
  if (answers.data === "tanstack-query") {
    deps.add("@tanstack/react-query");
    deps.add("@tanstack/react-query-devtools");
  } else if (answers.data === "swr") {
    deps.add("swr");
  }

  // ── Linting & formatting ───────────────────────────────────────────────
  if (answers.linting === "eslint-prettier") {
    dev.add("eslint");
    dev.add("eslint-config-next");
    dev.add("prettier");
    dev.add("eslint-config-prettier");
    if (answers.styling === "tailwind") dev.add("prettier-plugin-tailwindcss");
    scripts.lint = "eslint .";
    scripts.format = "prettier --write .";
  } else if (answers.linting === "biome") {
    dev.add("@biomejs/biome");
    scripts.lint = "biome lint .";
    scripts.format = "biome check --write .";
  }

  // ── Extras ─────────────────────────────────────────────────────────────
  const extras = new Set(answers.extras);

  if (extras.has("vitest")) {
    dev.add("vitest");
    dev.add("@vitejs/plugin-react");
    dev.add("jsdom");
    dev.add("@testing-library/react");
    dev.add("@testing-library/dom");
    dev.add("@testing-library/jest-dom");
    dev.add("@testing-library/user-event");
    dev.add("vite-tsconfig-paths");
    scripts.test = "vitest";
    scripts["test:run"] = "vitest run";
  }

  if (extras.has("rhf-zod")) {
    deps.add("react-hook-form");
    deps.add("zod");
    deps.add("@hookform/resolvers");
  }

  if (extras.has("framer-motion")) deps.add("motion");

  if (extras.has("husky")) {
    dev.add("husky");
    dev.add("lint-staged");
    scripts.prepare = "husky";
  }

  if (extras.has("env")) {
    deps.add("@t3-oss/env-nextjs");
    deps.add("zod");
  }

  return {
    dependencies: [...deps].sort(),
    devDependencies: [...dev].sort(),
    scripts,
  };
}

/**
 * Build the install command argv for the chosen package manager.
 * Returns { command, args } or null when there is nothing to install.
 */
export function installCommand(pm, packages, { dev = false } = {}) {
  if (!packages.length) return null;
  switch (pm) {
    case "pnpm":
      return { command: "pnpm", args: ["add", ...(dev ? ["-D"] : []), ...packages] };
    case "yarn":
      return { command: "yarn", args: ["add", ...(dev ? ["-D"] : []), ...packages] };
    case "bun":
      return { command: "bun", args: ["add", ...(dev ? ["-d"] : []), ...packages] };
    case "npm":
    default:
      return { command: "npm", args: ["install", ...(dev ? ["-D"] : []), ...packages] };
  }
}

/** The run-a-script invocation for the chosen package manager. */
export function runScriptCommand(pm, script) {
  switch (pm) {
    case "pnpm":
      return { command: "pnpm", args: [script] };
    case "yarn":
      return { command: "yarn", args: [script] };
    case "bun":
      return { command: "bun", args: ["run", script] };
    case "npm":
    default:
      return { command: "npm", args: ["run", script] };
  }
}
