/**
 * Content templates for every file the generator can emit.
 * Each function takes the answers (and resolved paths where relevant) and
 * returns a string. Components avoid TS-only syntax unless `isTS` branches,
 * so the same JSX template is valid as `.tsx` or `.jsx`.
 */

const LABELS = {
  styling: {
    tailwind: "Tailwind CSS",
    "css-modules": "CSS Modules",
    "vanilla-css": "Vanilla CSS",
    "styled-components": "styled-components",
  },
  architecture: {
    feature: "Feature-Based",
    fsd: "Feature-Sliced Design",
    atomic: "Atomic Design",
    default: "Default (flat)",
  },
  state: { none: "React state", zustand: "Zustand", redux: "Redux Toolkit", jotai: "Jotai" },
  data: { none: "Server Components", "tanstack-query": "TanStack Query", swr: "SWR" },
  linting: { "eslint-prettier": "ESLint + Prettier", biome: "Biome", none: "None" },
};

/** Build the rows shown on the generated landing page. */
export function stackData(a) {
  const rows = [
    ["Language", a.language === "ts" ? "TypeScript" : "JavaScript"],
    ["Architecture", LABELS.architecture[a.architecture]],
    ["Styling", LABELS.styling[a.styling] + (a.ui === "shadcn" ? " + shadcn/ui" : "")],
    ["State", LABELS.state[a.state]],
    ["Data", LABELS.data[a.data]],
    ["Tooling", LABELS.linting[a.linting]],
  ];
  if (a.extras.length) rows.push(["Extras", a.extras.join(", ")]);
  return rows;
}

// ───────────────────────────────────────────────────────── config files ──

export const gitignore = () => `# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;

export const tsconfig = () => `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

export const jsconfig = () => `{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
`;

export const nextEnv = () => `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`;

export const nextConfig = (a) =>
  a.language === "ts"
    ? `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`
    : `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`;

export const postcssConfig = () => `const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
`;

export const eslintConfig = (a) => {
  const isTS = a.language === "ts";
  const tsImport = isTS
    ? `import nextTypescript from "eslint-config-next/typescript";\n`
    : "";
  const tsSpread = isTS ? "  ...nextTypescript,\n" : "";
  return `import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
${tsImport}import eslintConfigPrettier from "eslint-config-prettier";

// Next.js 16 ships native flat configs — import them directly.
const eslintConfig = [
  ...nextCoreWebVitals,
${tsSpread}  eslintConfigPrettier,
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "build/**"],
  },
];

export default eslintConfig;
`;
};

export const prettierrc = (a) => {
  const plugins = a.styling === "tailwind" ? '\n  "plugins": ["prettier-plugin-tailwindcss"],' : "";
  return `{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,${plugins}
  "endOfLine": "lf"
}
`;
};

export const prettierignore = () => `.next
node_modules
dist
build
coverage
pnpm-lock.yaml
package-lock.json
yarn.lock
bun.lockb
`;

export const biomeJson = () => `{
  "$schema": "https://biomejs.dev/schemas/2.5.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": false },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "javascript": {
    "formatter": { "quoteStyle": "double" }
  }
}
`;

export const componentsJson = (a, paths) => `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": ${a.language === "ts"},
  "tailwind": {
    "config": "",
    "css": "${paths.stylesFile}",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "${paths.componentsAlias}",
    "utils": "${paths.cnImport}",
    "ui": "${paths.uiAlias}",
    "lib": "${paths.libAlias}",
    "hooks": "${paths.hooksAlias}"
  },
  "iconLibrary": "lucide"
}
`;

export const envExample = () => `# Copy to .env.local and fill in values.
# Variables prefixed with NEXT_PUBLIC_ are exposed to the browser.

# NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

// ───────────────────────────────────────────────────────────── styling ──

export function globalsCss(a) {
  if (a.styling === "tailwind" && a.ui === "shadcn") return shadcnGlobals();
  if (a.styling === "tailwind") return tailwindGlobals();
  return plainGlobals(a);
}

const tailwindGlobals = () => `@import "tailwindcss";

@layer base {
  :root {
    --background: #ffffff;
    --foreground: #0a0a0a;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --background: #0a0a0a;
      --foreground: #ededed;
    }
  }

  body {
    background: var(--background);
    color: var(--foreground);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
}
`;

const shadcnGlobals = () => `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;

const plainGlobals = (a) => `:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --muted: #6b7280;
  --border: #e5e7eb;
  --card: #ffffff;
  --radius: 0.625rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --muted: #9ca3af;
    --border: #27272a;
    --card: #111113;
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  max-width: 100vw;
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}
${a.styling === "vanilla-css" ? VANILLA_PAGE_CSS : ""}`;

// Global classes for the vanilla-CSS landing page (appended to globals.css).
const VANILLA_PAGE_CSS = `
/* ── landing page ── */
.home-main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  padding: 2rem;
}
.home-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}
.home-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}
.home-subtitle {
  color: var(--muted);
  max-width: 36rem;
}
.home-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 42rem;
}
.home-card {
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
}
.home-card-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}
.home-card-value {
  margin-top: 0.25rem;
  font-weight: 600;
}
.home-footer {
  color: var(--muted);
  font-size: 0.875rem;
}
@media (max-width: 640px) {
  .home-grid {
    grid-template-columns: 1fr;
  }
}
`;

export const pageModuleCss = () => `.main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  padding: 2rem;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}
.title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}
.subtitle {
  color: var(--muted);
  max-width: 36rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 42rem;
}
.card {
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
}
.label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}
.value {
  margin-top: 0.25rem;
  font-weight: 600;
}
.footer {
  color: var(--muted);
  font-size: 0.875rem;
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
`;

// ────────────────────────────────────────────────────────────── layout ──

export function rootLayout(a, paths, needsProviders) {
  const isTS = a.language === "ts";
  const metaType = isTS ? "import type { Metadata } from \"next\";\n" : "";
  const metaDecl = isTS
    ? "export const metadata: Metadata = {"
    : "/** @type {import('next').Metadata} */\nexport const metadata = {";
  const childrenParam = isTS ? "{\n  children,\n}: {\n  children: React.ReactNode;\n}" : "{ children }";
  const providersImport = needsProviders
    ? `import { Providers } from "${paths.providersImport}";\n`
    : "";
  const body = needsProviders ? "<Providers>{children}</Providers>" : "{children}";

  return `${metaType}import "${paths.stylesImport}";
${providersImport}
${metaDecl}
  title: "${a.projectName}",
  description: "Built with create-next-kit",
};

export default function RootLayout(${childrenParam}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        ${body}
      </body>
    </html>
  );
}
`;
}

// ──────────────────────────────────────────────────────────── providers ──

export function providersComponent(a, paths) {
  const isTS = a.language === "ts";
  const imports = [];
  const stateInit = [];
  const opens = [];
  const closes = [];
  let devtools = "";

  if (a.styling === "styled-components") {
    imports.push(`import { StyledComponentsRegistry } from "${paths.registryImport}";`);
    opens.push("<StyledComponentsRegistry>");
    closes.unshift("</StyledComponentsRegistry>");
  }
  if (a.state === "redux") {
    imports.push(`import { Provider as ReduxProvider } from "react-redux";`);
    imports.push(`import { store } from "${paths.storeImport}";`);
    opens.push("<ReduxProvider store={store}>");
    closes.unshift("</ReduxProvider>");
  } else if (a.state === "jotai") {
    imports.push(`import { Provider as JotaiProvider } from "jotai";`);
    opens.push("<JotaiProvider>");
    closes.unshift("</JotaiProvider>");
  }
  if (a.data === "tanstack-query") {
    imports.push(`import { useState } from "react";`);
    imports.push(`import { QueryClient, QueryClientProvider } from "@tanstack/react-query";`);
    imports.push(`import { ReactQueryDevtools } from "@tanstack/react-query-devtools";`);
    stateInit.push("const [queryClient] = useState(() => new QueryClient());");
    opens.push("<QueryClientProvider client={queryClient}>");
    closes.unshift("</QueryClientProvider>");
    devtools = "\n      <ReactQueryDevtools initialIsOpen={false} />";
  } else if (a.data === "swr") {
    imports.push(`import { SWRConfig } from "swr";`);
    opens.push("<SWRConfig value={{ revalidateOnFocus: false }}>");
    closes.unshift("</SWRConfig>");
  }

  const childrenType = isTS ? ": { children: React.ReactNode }" : "";
  const importBlock = imports.length ? `${imports.join("\n")}\n\n` : "";
  const stateBlock = stateInit.length ? `  ${stateInit.join("\n  ")}\n\n` : "";

  // Indent the nested element tree so it reads cleanly under `return (`.
  const tree = [];
  opens.forEach((tag, i) => tree.push(`${"  ".repeat(i + 2)}${tag}`));
  tree.push(`${"  ".repeat(opens.length + 2)}{children}`);
  if (devtools) tree.push(`${"  ".repeat(opens.length + 2)}${devtools.trim()}`);
  closes.forEach((tag, i) => tree.push(`${"  ".repeat(opens.length - i + 1)}${tag}`));

  return `"use client";

${importBlock}export function Providers({ children }${childrenType}) {
${stateBlock}  return (
${tree.join("\n")}
  );
}
`;
}

export function styledRegistry(a) {
  const isTS = a.language === "ts";
  const childrenType = isTS ? ": { children: React.ReactNode }" : "";
  return `"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export function StyledComponentsRegistry({ children }${childrenType}) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
`;
}

// ────────────────────────────────────────────────────── shadcn helpers ──

export const cnUtil = (a) =>
  a.language === "ts"
    ? `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`
    : `import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
`;

export function buttonComponent(a, paths) {
  const isTS = a.language === "ts";
  const variantsImport = isTS
    ? `import { cva, type VariantProps } from "class-variance-authority";`
    : `import { cva } from "class-variance-authority";`;
  const signature = isTS
    ? `function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  })`
    : `function Button({ className, variant, size, asChild = false, ...props })`;

  return `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
${variantsImport}

import { cn } from "${paths.cnImport}";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

${signature} {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
`;
}

// ──────────────────────────────────────────────────────── state stores ──

export function zustandStore(a) {
  return a.language === "ts"
    ? `import { create } from "zustand";

type CounterState = {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
};

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set({ count: 0 }),
}));
`
    : `import { create } from "zustand";

export const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set({ count: 0 }),
}));
`;
}

export const reduxStore = (a) =>
  a.language === "ts"
    ? `import { configureStore } from "@reduxjs/toolkit";
import { counterReducer } from "./counter-slice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
`
    : `import { configureStore } from "@reduxjs/toolkit";
import { counterReducer } from "./counter-slice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});
`;

export const reduxSlice = () => `import { createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    reset: (state) => {
      state.value = 0;
    },
  },
});

export const { increment, decrement, reset } = counterSlice.actions;
export const counterReducer = counterSlice.reducer;
`;

export const reduxHooks = () => `import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from ".";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
`;

export const jotaiAtoms = () => `import { atom } from "jotai";

export const counterAtom = atom(0);
`;

// ────────────────────────────────────────────────────────── typed env ──

export const envFile = () => `import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {
    // NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    // NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
});
`;

// ──────────────────────────────────────────────────────────── testing ──

export const vitestConfig = (a) => {
  const setupExt = a.language === "ts" ? "ts" : "js";
  return `import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.${setupExt}"],
  },
});
`;
};

export const vitestSetup = () => `import "@testing-library/jest-dom/vitest";
`;

export const sampleTest = () => `import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

function Hello() {
  return <h1>Hello, world</h1>;
}

describe("smoke test", () => {
  it("renders a heading", () => {
    render(<Hello />);
    expect(screen.getByRole("heading", { name: /hello, world/i })).toBeInTheDocument();
  });
});
`;

// ─────────────────────────────────────────────────────── husky / hooks ──

export const huskyPreCommit = (a) =>
  a.linting === "none" ? `echo "no linter configured"\n` : `npx lint-staged\n`;

export function lintStagedConfig(a) {
  if (a.linting === "biome") {
    return { "*.{js,jsx,ts,tsx,json,css}": ["biome check --write --no-errors-on-unmatched"] };
  }
  if (a.linting === "eslint-prettier") {
    return {
      "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
      "*.{json,css,md}": ["prettier --write"],
    };
  }
  return null;
}

// ─────────────────────────────────────────────────── landing page body ──

/** Returns the class-name token map for a class-based styling solution. */
function classTokens(a) {
  if (a.styling === "tailwind") {
    const muted = a.ui === "shadcn" ? "text-muted-foreground" : "text-gray-500 dark:text-gray-400";
    const cardBorder = a.ui === "shadcn" ? "border-border bg-card" : "border-gray-200 dark:border-gray-800";
    return {
      main: "flex min-h-screen flex-col items-center justify-center gap-10 p-8",
      hero: "flex flex-col items-center gap-3 text-center",
      title: "text-4xl font-bold tracking-tight sm:text-5xl",
      subtitle: `max-w-xl ${muted}`,
      grid: "grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2",
      card: `rounded-lg border p-4 ${cardBorder}`,
      label: `text-xs uppercase tracking-wide ${muted}`,
      value: "mt-1 font-semibold",
      footer: `text-sm ${muted}`,
    };
  }
  // css-modules uses `styles.x`; vanilla uses literal global class names.
  return null;
}

export function homePage(a, paths) {
  if (a.styling === "styled-components") return styledHomePage(a);
  if (a.styling === "css-modules") return moduleHomePage(a);
  if (a.styling === "vanilla-css") return vanillaHomePage(a);
  return tailwindHomePage(a, paths);
}

function rowsLiteral(a) {
  return stackData(a)
    .map(([label, value]) => `    ["${label}", ${JSON.stringify(value)}],`)
    .join("\n");
}

function tailwindHomePage(a, paths) {
  const t = classTokens(a);
  const button =
    a.ui === "shadcn"
      ? `import { Button } from "${paths.uiAlias}/button";\n`
      : "";
  const cta =
    a.ui === "shadcn"
      ? `\n      <Button asChild>
        <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer">
          Read the docs
        </a>
      </Button>`
      : "";
  return `${button}const stack = [
${rowsLiteral(a)}
];

export default function Home() {
  return (
    <main className="${t.main}">
      <section className="${t.hero}">
        <h1 className="${t.title}">${a.projectName}</h1>
        <p className="${t.subtitle}">
          Scaffolded with create-next-kit. Edit{" "}
          <code>app/page.${a.language === "ts" ? "tsx" : "jsx"}</code> to get started.
        </p>${cta}
      </section>

      <div className="${t.grid}">
        {stack.map(([label, value]) => (
          <div key={label} className="${t.card}">
            <div className="${t.label}">{label}</div>
            <div className="${t.value}">{value}</div>
          </div>
        ))}
      </div>

      <footer className="${t.footer}">Happy building.</footer>
    </main>
  );
}
`;
}

function moduleHomePage(a) {
  return `import styles from "./page.module.css";

const stack = [
${rowsLiteral(a)}
];

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={styles.title}>${a.projectName}</h1>
        <p className={styles.subtitle}>
          Scaffolded with create-next-kit. Edit{" "}
          <code>app/page.${a.language === "ts" ? "tsx" : "jsx"}</code> to get started.
        </p>
      </section>

      <div className={styles.grid}>
        {stack.map(([label, value]) => (
          <div key={label} className={styles.card}>
            <div className={styles.label}>{label}</div>
            <div className={styles.value}>{value}</div>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>Happy building.</footer>
    </main>
  );
}
`;
}

function vanillaHomePage(a) {
  return `const stack = [
${rowsLiteral(a)}
];

export default function Home() {
  return (
    <main className="home-main">
      <section className="home-hero">
        <h1 className="home-title">${a.projectName}</h1>
        <p className="home-subtitle">
          Scaffolded with create-next-kit. Edit{" "}
          <code>app/page.${a.language === "ts" ? "tsx" : "jsx"}</code> to get started.
        </p>
      </section>

      <div className="home-grid">
        {stack.map(([label, value]) => (
          <div key={label} className="home-card">
            <div className="home-card-label">{label}</div>
            <div className="home-card-value">{value}</div>
          </div>
        ))}
      </div>

      <footer className="home-footer">Happy building.</footer>
    </main>
  );
}
`;
}

function styledHomePage(a) {
  return `"use client";

import styled from "styled-components";

const stack = [
${rowsLiteral(a)}
];

const Main = styled.main\`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  padding: 2rem;
\`;

const Hero = styled.section\`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
\`;

const Title = styled.h1\`
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
\`;

const Subtitle = styled.p\`
  color: var(--muted);
  max-width: 36rem;
\`;

const Grid = styled.div\`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 42rem;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
\`;

const Card = styled.div\`
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
\`;

const Label = styled.div\`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
\`;

const Value = styled.div\`
  margin-top: 0.25rem;
  font-weight: 600;
\`;

export default function Home() {
  return (
    <Main>
      <Hero>
        <Title>${a.projectName}</Title>
        <Subtitle>
          Scaffolded with create-next-kit. Edit app/page.${a.language === "ts" ? "tsx" : "jsx"} to get started.
        </Subtitle>
      </Hero>

      <Grid>
        {stack.map(([label, value]) => (
          <Card key={label}>
            <Label>{label}</Label>
            <Value>{value}</Value>
          </Card>
        ))}
      </Grid>
    </Main>
  );
}
`;
}
