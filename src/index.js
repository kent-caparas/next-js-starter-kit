import { join } from "node:path";
import { cancel, intro, log, note, outro } from "@clack/prompts";
import pc from "picocolors";
import { installCommand, resolvePlan } from "./dependencies.js";
import {
  gatherAnswers,
  parseArgs,
  printSummary,
  resolveNonInteractive,
} from "./prompts.js";
import { scaffold } from "./scaffold.js";
import { dirExistsAndNotEmpty, run } from "./utils.js";

export async function main(argv) {
  const flags = parseArgs(argv);

  intro(pc.bgCyan(pc.black(" create-next-kit ")));

  const answers = flags.yes ? resolveNonInteractive(flags) : await gatherAnswers(flags);
  printSummary(answers);

  const root = join(process.cwd(), answers.projectName);
  if (dirExistsAndNotEmpty(root)) {
    cancel(`Directory "${answers.projectName}" already exists and is not empty.`);
    process.exit(1);
  }

  const plan = resolvePlan(answers);

  await scaffold(root, answers, plan);
  log.success(`Scaffolded ${pc.cyan(answers.projectName)}`);

  // Init git before installing — husky's `prepare` script needs a git repo.
  const effectiveGit = answers.git || answers.extras.includes("husky");
  if (effectiveGit) {
    try {
      await run("git", ["init", "-q"], { cwd: root });
      log.step("Initialized git repository");
    } catch {
      log.warn("Could not initialize git — is it installed?");
    }
  }

  if (answers.install) {
    const pm = answers.packageManager;
    note(`Installing dependencies with ${pc.cyan(pm)} …`, "Install");
    // Dev deps first so husky (if selected) exists before any `prepare` runs.
    const dev = installCommand(pm, plan.devDependencies, { dev: true });
    const prod = installCommand(pm, plan.dependencies, { dev: false });
    try {
      if (dev) await run(dev.command, dev.args, { cwd: root });
      if (prod) await run(prod.command, prod.args, { cwd: root });
      log.success("Dependencies installed");
    } catch {
      log.error("Dependency install failed — finish it manually:");
      log.message(`  cd ${answers.projectName}\n  ${pm} install`);
    }
  }

  printNextSteps(answers);
  outro(pc.green("Done — happy building!"));
}

function printNextSteps(answers) {
  const pm = answers.packageManager;
  const steps = [`cd ${answers.projectName}`];
  if (!answers.install) steps.push(`${pm} install`);
  steps.push(`${pm} run dev`);
  note(steps.map((s) => pc.cyan(s)).join("\n"), "Next steps");
}
