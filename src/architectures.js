import { ensureDir, writeProjectFile } from "./utils.js";

/**
 * Resolve every "plumbing" path and import alias for the chosen architecture.
 * Routing always lives in the root-level `app/` directory; everything else
 * lives under `src/` and is shaped by the selected architecture.
 */
export function getPaths(a) {
  const x = a.language === "ts" ? "tsx" : "jsx";
  const m = a.language === "ts" ? "ts" : "js";

  if (a.architecture === "fsd") {
    return {
      stylesFile: "src/app/styles/globals.css",
      stylesImport: "@/app/styles/globals.css",
      providersFile: `src/app/providers/providers.${x}`,
      providersImport: "@/app/providers/providers",
      registryFile: `src/app/providers/styled-registry.${x}`,
      registryImport: "@/app/providers/styled-registry",
      storeDir: "src/app/store",
      storeImport: "@/app/store",
      cnFile: `src/shared/lib/utils.${m}`,
      cnImport: "@/shared/lib/utils",
      uiDir: "src/shared/ui",
      uiAlias: "@/shared/ui",
      libAlias: "@/shared/lib",
      hooksAlias: "@/shared/lib/hooks",
      componentsAlias: "@/shared/ui",
      envFile: `src/shared/config/env.${m}`,
    };
  }

  // feature / atomic / default share the same plumbing layout.
  return {
    stylesFile: "src/styles/globals.css",
    stylesImport: "@/styles/globals.css",
    providersFile: `src/providers/providers.${x}`,
    providersImport: "@/providers/providers",
    registryFile: `src/lib/styled-registry.${x}`,
    registryImport: "@/lib/styled-registry",
    storeDir: "src/store",
    storeImport: "@/store",
    cnFile: `src/lib/utils.${m}`,
    cnImport: "@/lib/utils",
    uiDir: "src/components/ui",
    uiAlias: "@/components/ui",
    libAlias: "@/lib",
    hooksAlias: "@/hooks",
    componentsAlias: "@/components",
    envFile: `src/env.${m}`,
  };
}

/** A minimal, dependency-free example component (valid as .tsx or .jsx). */
function exampleComponent(name, text) {
  return `export function ${name}() {
  return <p>${text}</p>;
}
`;
}

/** Create the folder tree, barrels, READMEs and example files. */
export async function scaffoldArchitecture(root, a) {
  const x = a.language === "ts" ? "tsx" : "jsx";
  const m = a.language === "ts" ? "ts" : "js";

  switch (a.architecture) {
    case "fsd":
      return scaffoldFsd(root, x, m);
    case "feature":
      return scaffoldFeature(root, x, m);
    case "atomic":
      return scaffoldAtomic(root, x);
    case "default":
    default:
      return scaffoldDefault(root, x, m);
  }
}

// ──────────────────────────────────────────────────────────────── default ──

async function scaffoldDefault(root, x, m) {
  await ensureDir(root, "src/components");
  await ensureDir(root, "src/lib");
  await ensureDir(root, "src/types");
  await writeProjectFile(
    root,
    `src/hooks/use-mounted.${m}`,
    `import { useEffect, useState } from "react";

/** Returns true once the component has mounted on the client. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
`,
  );
  await writeProjectFile(
    root,
    `src/components/example-card.${x}`,
    exampleComponent("ExampleCard", "An example shared component. Put reusable UI in src/components."),
  );
  await writeProjectFile(root, "src/README.md", DEFAULT_README);
}

// ───────────────────────────────────────────────────────────── feature ──

async function scaffoldFeature(root, x, m) {
  await ensureDir(root, "src/components");
  await ensureDir(root, "src/lib");
  await ensureDir(root, "src/hooks");
  await ensureDir(root, "src/types");
  await ensureDir(root, "src/features/welcome/api");
  await ensureDir(root, "src/features/welcome/hooks");

  await writeProjectFile(
    root,
    `src/features/welcome/components/welcome-message.${x}`,
    exampleComponent("WelcomeMessage", "Hello from the welcome feature."),
  );
  await writeProjectFile(
    root,
    `src/features/welcome/index.${m}`,
    `export { WelcomeMessage } from "./components/welcome-message";
`,
  );
  await writeProjectFile(root, "src/features/README.md", FEATURE_README);
  await writeProjectFile(root, "src/README.md", FEATURE_ROOT_README);
}

// ────────────────────────────────────────────────────────────── atomic ──

async function scaffoldAtomic(root, x) {
  await ensureDir(root, "src/lib");
  await ensureDir(root, "src/hooks");
  await ensureDir(root, "src/components/templates");

  await writeProjectFile(
    root,
    `src/components/atoms/example-button.${x}`,
    `export function ExampleButton({ children, ...props }) {
  return <button {...props}>{children}</button>;
}
`,
  );
  await writeProjectFile(
    root,
    `src/components/molecules/example-field.${x}`,
    exampleComponent("ExampleField", "A molecule composes atoms (e.g. label + input)."),
  );
  await writeProjectFile(
    root,
    `src/components/organisms/example-section.${x}`,
    exampleComponent("ExampleSection", "An organism composes molecules into a page section."),
  );
  await writeProjectFile(root, "src/components/README.md", ATOMIC_README);
}

// ───────────────────────────────────────────────────────────────── fsd ──

async function scaffoldFsd(root, x, m) {
  // Layers, ordered shared → entities → features → widgets → views → app.
  await ensureDir(root, "src/shared/api");
  await ensureDir(root, "src/shared/lib/hooks");
  await ensureDir(root, "src/shared/config");
  await ensureDir(root, "src/entities");
  await ensureDir(root, "src/features");
  await ensureDir(root, "src/widgets");

  // Example view with a barrel (FSD "pages" layer, renamed to avoid the
  // Next.js Pages Router collision).
  await writeProjectFile(
    root,
    `src/views/home/ui/home-page.${x}`,
    exampleComponent("HomePage", "An FSD view. Compose widgets and features here."),
  );
  await writeProjectFile(
    root,
    `src/views/home/index.${m}`,
    `export { HomePage } from "./ui/home-page";
`,
  );

  // Per-layer READMEs documenting the import rules.
  await writeProjectFile(root, "src/shared/README.md", layerReadme("shared", "the lowest layer — UI kit, helpers, configs. May not import from any other layer."));
  await writeProjectFile(root, "src/entities/README.md", layerReadme("entities", "business entities (user, product). May import from shared only."));
  await writeProjectFile(root, "src/features/README.md", layerReadme("features", "user interactions / use-cases. May import from entities and shared."));
  await writeProjectFile(root, "src/widgets/README.md", layerReadme("widgets", "composite blocks (header, sidebar). May import from features, entities, shared."));
  await writeProjectFile(root, "src/views/README.md", layerReadme("views", "route-level compositions. May import from widgets, features, entities, shared."));
  await writeProjectFile(root, "src/README.md", FSD_ROOT_README);
}

function layerReadme(name, desc) {
  return `# ${name}

The **${name}** layer: ${desc}

Each slice is a folder with optional segments:

- \`ui/\` — components
- \`model/\` — state, types, business logic
- \`lib/\` — helpers
- \`api/\` — data access

Expose a slice's public surface through its \`index\` barrel; import other
slices only through that barrel, never reaching into their internals.
`;
}

// ──────────────────────────────────────────────────────────── READMEs ──

const DEFAULT_README = `# Source structure (flat)

\`\`\`
src/
├── components/   # reusable UI components
├── hooks/        # shared React hooks
├── lib/          # utilities, clients, helpers
└── types/        # shared TypeScript types
\`\`\`

Routing lives in the root-level \`app/\` directory (App Router). Keep route
files thin and move logic into the folders above.
`;

const FEATURE_ROOT_README = `# Source structure (feature-based)

\`\`\`
src/
├── features/     # self-contained feature modules
│   └── welcome/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       └── index.ts   # public surface (import features through this)
├── components/   # shared, cross-feature UI
├── hooks/        # shared hooks
├── lib/          # utilities
└── types/        # shared types
\`\`\`

Routing lives in the root-level \`app/\` directory. A route renders a feature
by importing from its barrel: \`import { WelcomeMessage } from "@/features/welcome"\`.
`;

const FEATURE_README = `# features/

Each feature is a self-contained module. Keep everything a feature needs
(components, hooks, API calls, types) inside its folder and expose only what
other code should use via \`index.ts\`.

Rules of thumb:

- Features should not import from each other directly. Lift shared code into
  \`src/components\`, \`src/hooks\` or \`src/lib\`.
- A route in \`app/\` is a thin wrapper that composes features.
`;

const ATOMIC_README = `# components/ (Atomic Design)

\`\`\`
components/
├── atoms/        # smallest building blocks (Button, Input, Label)
├── molecules/    # small groups of atoms (FormField = Label + Input)
├── organisms/    # complex sections (Header, ProductCard)
└── templates/    # page-level layouts (no real data)
\`\`\`

Compose upward: molecules use atoms, organisms use molecules, templates use
organisms. Routing lives in the root-level \`app/\` directory; pages place data
into templates.
`;

const FSD_ROOT_README = `# Source structure (Feature-Sliced Design)

Layers, from lowest to highest. A layer may only import from the layers below it.

\`\`\`
src/
├── app/          # app-wide providers, styles, store (FSD "app" layer)
├── views/        # route compositions (FSD "pages", renamed for Next.js)
├── widgets/      # composite UI blocks
├── features/     # user interactions / use-cases
├── entities/     # business entities
└── shared/       # UI kit, libs, config (no upward imports)
\`\`\`

Next.js routing stays in the root-level \`app/\` directory and stays thin: each
route imports a view, e.g. \`import { HomePage } from "@/views/home"\`.

See the \`README.md\` inside each layer for its specific import rules.
`;
