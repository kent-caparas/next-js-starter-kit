import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Write a file, creating parent directories as needed.
 * A trailing newline is enforced so generated files are clean.
 */
export async function writeProjectFile(root, relativePath, contents) {
  const fullPath = join(root, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  const body = contents.endsWith("\n") ? contents : `${contents}\n`;
  await writeFile(fullPath, body, "utf8");
}

/** Create a directory (and a `.gitkeep` so git tracks it when empty). */
export async function ensureDir(root, relativePath, withGitkeep = true) {
  const fullPath = join(root, relativePath);
  await mkdir(fullPath, { recursive: true });
  if (withGitkeep) {
    await writeFile(join(fullPath, ".gitkeep"), "", "utf8");
  }
}

/**
 * Run a command, streaming its output to the terminal.
 * Resolves on exit code 0, rejects otherwise.
 */
export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      // Windows resolves npm/npx/yarn/bun shims through the shell.
      shell: process.platform === "win32",
      ...options,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`\`${command} ${args.join(" ")}\` exited with code ${code}`));
    });
  });
}

/** True when an executable is resolvable on the current PATH. */
export function commandExists(command) {
  const probe = process.platform === "win32" ? "where" : "which";
  const res = spawnSync(probe, [command], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  return res.status === 0;
}

/** Detect which package managers are installed on this machine. */
export function detectPackageManagers() {
  return ["npm", "pnpm", "yarn", "bun"].filter((pm) => commandExists(pm));
}

/** True when the target directory exists and is non-empty. */
export function dirExistsAndNotEmpty(path) {
  if (!existsSync(path)) return false;
  return readdirSync(path).length > 0;
}
