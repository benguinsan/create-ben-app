#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import { validateProjectName } from "./validate-name";

const PACKAGE_NAME = "create-ben-app";
const DEFAULT_APP_NAME = "my-app";

const getPositionalName = (): string | undefined => {
  // Skip node binary + script path; take first non-flag arg
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  return args[0];
};

const resolveProjectName = async (): Promise<string> => {
  const fromArg = getPositionalName();

  if (fromArg !== undefined) {
    const argError = validateProjectName(fromArg);
    if (!argError) {
      return fromArg.trim();
    }

    p.log.warn(
      pc.yellow(
        `Ignoring invalid name ${pc.bold(fromArg)}: ${argError}. Asking interactively…`,
      ),
    );
  }

  if (!process.stdin.isTTY) {
    console.error(
      pc.red(
        `${PACKAGE_NAME} needs a project name. Pass one as an argument, e.g.:`,
      ),
    );
    console.error(pc.cyan(`  npx ${PACKAGE_NAME} ${DEFAULT_APP_NAME}`));
    process.exit(1);
  }

  const answer = await p.text({
    message: "What will your project be called?",
    defaultValue: DEFAULT_APP_NAME,
    placeholder: DEFAULT_APP_NAME,
    validate: validateProjectName,
  });

  if (p.isCancel(answer)) {
    p.cancel("Operation cancelled.");
    process.exit(1);
  }

  return answer.trim() || DEFAULT_APP_NAME;
};

const main = async (): Promise<void> => {
  p.intro(pc.bgCyan(pc.black(` ${PACKAGE_NAME} `)));

  const projectName = await resolveProjectName();

  p.note(pc.bold(projectName), "Project name");
  p.outro(
    pc.green(
      `Next: scaffold templates → ./${projectName} (not wired yet)`,
    ),
  );
};

main().catch((error: unknown) => {
  console.error(pc.red("Aborting…"));
  if (error instanceof Error) {
    console.error(pc.red(error.message));
  } else {
    console.error(error);
  }
  process.exit(1);
});

process.on("SIGINT", () => {
  console.error(pc.yellow(`\n${PACKAGE_NAME} cancelled.`));
  process.exit(0);
});
