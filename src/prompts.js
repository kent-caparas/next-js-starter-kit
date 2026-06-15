import {
  cancel,
  confirm,
  group,
  isCancel,
  multiselect,
  note,
  select,
  text,
} from "@clack/prompts";
import pc from "picocolors";
import { detectPackageManagers } from "./utils.js";

/** Defaults used by `--yes` and as initial values in prompts. */
export const DEFAULTS = {
  projectName: "my-next-app",
  language: "ts",
  packageManager: "npm",
  styling: "tailwind",
  ui: "shadcn",
  architecture: "feature",
  state: "none",
  data: "none",
  linting: "eslint-prettier",
  extras: [],
  install: true,
  git: true,
};

/** Parse CLI flags. Supports: <name> --yes --no-install --no-git --pm <x>. */
export function parseArgs(argv) {
  const flags = { yes: false, install: null, git: null, pm: null, name: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--yes" || arg === "-y") flags.yes = true;
    else if (arg === "--no-install") flags.install = false;
    else if (arg === "--install") flags.install = true;
    else if (arg === "--no-git") flags.git = false;
    else if (arg === "--git") flags.git = true;
    else if (arg === "--pm") flags.pm = argv[++i];
    else if (!arg.startsWith("-") && !flags.name) flags.name = arg;
  }
  return flags;
}

function bail(value) {
  if (isCancel(value)) {
    cancel("Scaffolding cancelled.");
    process.exit(0);
  }
  return value;
}

/** Build the answer set from flags + defaults, skipping all prompts. */
export function resolveNonInteractive(flags) {
  const available = detectPackageManagers();
  const pm = flags.pm && available.includes(flags.pm) ? flags.pm : DEFAULTS.packageManager;
  return {
    ...DEFAULTS,
    projectName: flags.name || DEFAULTS.projectName,
    packageManager: pm,
    install: flags.install ?? DEFAULTS.install,
    git: flags.git ?? DEFAULTS.git,
  };
}

/** Run the full interactive questionnaire and return the answers. */
export async function gatherAnswers(flags) {
  const available = detectPackageManagers();
  const pmOptions = (available.length ? available : ["npm"]).map((pm) => ({
    value: pm,
    label: pm,
  }));

  const answers = await group(
    {
      projectName: () =>
        text({
          message: "Project name?",
          placeholder: DEFAULTS.projectName,
          defaultValue: flags.name || DEFAULTS.projectName,
          initialValue: flags.name || undefined,
          validate(value) {
            const name = value || DEFAULTS.projectName;
            if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
              return "Use lowercase letters, numbers, dashes, dots or underscores.";
            }
          },
        }),

      language: () =>
        select({
          message: "Language?",
          initialValue: DEFAULTS.language,
          options: [
            { value: "ts", label: "TypeScript", hint: "recommended" },
            { value: "js", label: "JavaScript" },
          ],
        }),

      packageManager: () =>
        select({
          message: "Package manager?",
          initialValue: pmOptions.some((o) => o.value === DEFAULTS.packageManager)
            ? DEFAULTS.packageManager
            : pmOptions[0].value,
          options: pmOptions,
        }),

      styling: () =>
        select({
          message: "Styling solution?",
          initialValue: DEFAULTS.styling,
          options: [
            { value: "tailwind", label: "Tailwind CSS", hint: "v4, utility-first" },
            { value: "css-modules", label: "CSS Modules" },
            { value: "vanilla-css", label: "Vanilla CSS" },
            { value: "styled-components", label: "styled-components", hint: "CSS-in-JS" },
          ],
        }),

      ui: ({ results }) => {
        if (results.styling !== "tailwind") return Promise.resolve("none");
        return select({
          message: "Component library?",
          initialValue: DEFAULTS.ui,
          options: [
            { value: "shadcn", label: "shadcn/ui", hint: "Radix + Tailwind, copy-in components" },
            { value: "none", label: "None" },
          ],
        });
      },

      architecture: () =>
        select({
          message: "Frontend architecture?",
          initialValue: DEFAULTS.architecture,
          options: [
            {
              value: "feature",
              label: "Feature-Based (modular)",
              hint: "src/features/* + shared layers",
            },
            {
              value: "fsd",
              label: "Feature-Sliced Design",
              hint: "shared → entities → features → widgets → views",
            },
            {
              value: "atomic",
              label: "Atomic Design",
              hint: "atoms → molecules → organisms → templates",
            },
            { value: "default", label: "Default (flat Next.js)", hint: "components + lib" },
          ],
        }),

      state: () =>
        select({
          message: "State management?",
          initialValue: DEFAULTS.state,
          options: [
            { value: "none", label: "None", hint: "React state / Server Components" },
            { value: "zustand", label: "Zustand", hint: "minimal store" },
            { value: "redux", label: "Redux Toolkit" },
            { value: "jotai", label: "Jotai", hint: "atomic state" },
          ],
        }),

      data: () =>
        select({
          message: "Data fetching / server cache?",
          initialValue: DEFAULTS.data,
          options: [
            { value: "none", label: "None", hint: "fetch in Server Components" },
            { value: "tanstack-query", label: "TanStack Query" },
            { value: "swr", label: "SWR" },
          ],
        }),

      linting: () =>
        select({
          message: "Linting & formatting?",
          initialValue: DEFAULTS.linting,
          options: [
            { value: "eslint-prettier", label: "ESLint + Prettier" },
            { value: "biome", label: "Biome", hint: "fast all-in-one" },
            { value: "none", label: "None" },
          ],
        }),

      extras: () =>
        multiselect({
          message: "Extras? (space to toggle, enter to confirm)",
          required: false,
          initialValues: DEFAULTS.extras,
          options: [
            { value: "vitest", label: "Vitest + Testing Library", hint: "unit tests" },
            { value: "rhf-zod", label: "react-hook-form + zod", hint: "forms + validation" },
            { value: "framer-motion", label: "Motion (Framer Motion)", hint: "animations" },
            { value: "husky", label: "Husky + lint-staged", hint: "pre-commit hooks" },
            { value: "env", label: "Typed env (@t3-oss/env-nextjs)", hint: "validated env vars" },
          ],
        }),

      install: () =>
        confirm({
          message: "Install dependencies now?",
          initialValue: flags.install ?? DEFAULTS.install,
        }),

      git: () =>
        confirm({
          message: "Initialize a git repository?",
          initialValue: flags.git ?? DEFAULTS.git,
        }),
    },
    {
      onCancel: () => {
        cancel("Scaffolding cancelled.");
        process.exit(0);
      },
    },
  );

  // group() already handles cancellation, but normalize project name.
  answers.projectName = (bail(answers.projectName) || DEFAULTS.projectName).trim();
  return answers;
}

/** Print a recap of the selected stack before scaffolding. */
export function printSummary(answers) {
  const lines = [
    `${pc.dim("name")}          ${pc.cyan(answers.projectName)}`,
    `${pc.dim("language")}      ${answers.language === "ts" ? "TypeScript" : "JavaScript"}`,
    `${pc.dim("pkg manager")}   ${answers.packageManager}`,
    `${pc.dim("styling")}       ${labelFor("styling", answers.styling)}`,
    `${pc.dim("ui")}            ${labelFor("ui", answers.ui)}`,
    `${pc.dim("architecture")}  ${labelFor("architecture", answers.architecture)}`,
    `${pc.dim("state")}         ${labelFor("state", answers.state)}`,
    `${pc.dim("data")}          ${labelFor("data", answers.data)}`,
    `${pc.dim("linting")}       ${labelFor("linting", answers.linting)}`,
    `${pc.dim("extras")}        ${answers.extras.length ? answers.extras.join(", ") : "none"}`,
  ];
  note(lines.join("\n"), "Your stack");
}

function labelFor(group, value) {
  const maps = {
    styling: {
      tailwind: "Tailwind CSS",
      "css-modules": "CSS Modules",
      "vanilla-css": "Vanilla CSS",
      "styled-components": "styled-components",
    },
    ui: { shadcn: "shadcn/ui", none: "none" },
    architecture: {
      feature: "Feature-Based",
      fsd: "Feature-Sliced Design",
      atomic: "Atomic Design",
      default: "Default (flat)",
    },
    state: { none: "none", zustand: "Zustand", redux: "Redux Toolkit", jotai: "Jotai" },
    data: { none: "none", "tanstack-query": "TanStack Query", swr: "SWR" },
    linting: { "eslint-prettier": "ESLint + Prettier", biome: "Biome", none: "none" },
  };
  return maps[group]?.[value] ?? value;
}
