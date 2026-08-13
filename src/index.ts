#!/usr/bin/env node
import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { type FeatureId, scaffoldProject } from "./scaffold";
import { validateProjectName } from "./validate-name";

const PACKAGE_NAME = "create-my-custom-app";
const DEFAULT_APP_NAME = "my-app";
const DEFAULT_DESCRIPTION = "A project created with create-my-custom-app";

type AuthChoice = "clerk" | "none";
type EnvChoice = "t3" | "none";
type LinterChoice = "oxlint" | "eslint";

const FLAG_VALUE_SKIP = new Set(["--auth", "--env", "--linter"]);

const getPositionalName = (): string | undefined => {
  const args = process.argv.slice(2);
  const positionals: string[] = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (FLAG_VALUE_SKIP.has(arg)) {
      i += 1; // skip value
      continue;
    }
    if (arg.startsWith("--auth=") || arg.startsWith("--linter=") || arg.startsWith("--env=")) {
      continue;
    }
    if (arg === "--docker" || arg === "--no-docker") {
      continue;
    }
    if (arg.startsWith("-")) {
      continue;
    }
    positionals.push(arg);
  }

  return positionals[0];
};

const getAuthFlag = (): AuthChoice | undefined => {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--auth" || arg.startsWith("--auth=")) {
      const value = arg === "--auth" ? args[i + 1] : arg.slice("--auth=".length);
      if (value === "clerk" || value === "none") {
        return value;
      }
      console.error(
        pc.red(`Invalid --auth value ${pc.bold(String(value))}. Use clerk or none.`),
      );
      process.exit(1);
    }
  }
  return undefined;
};

const getEnvFlag = (): EnvChoice | undefined => {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--env" || arg.startsWith("--env=")) {
      const value = arg === "--env" ? args[i + 1] : arg.slice("--env=".length);
      if (value === "t3" || value === "none") {
        return value;
      }
      console.error(
        pc.red(`Invalid --env value ${pc.bold(String(value))}. Use t3 or none.`),
      );
      process.exit(1);
    }
  }
  return undefined;
};

const getLinterFlag = (): LinterChoice | undefined => {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--linter" || arg.startsWith("--linter=")) {
      const value =
        arg === "--linter" ? args[i + 1] : arg.slice("--linter=".length);
      if (value === "oxlint" || value === "eslint") {
        return value;
      }
      console.error(
        pc.red(
          `Invalid --linter value ${pc.bold(String(value))}. Use oxlint or eslint.`,
        ),
      );
      process.exit(1);
    }
  }
  return undefined;
};

const getDockerFlag = (): boolean | undefined => {
  const args = process.argv.slice(2);
  let docker: boolean | undefined;
  for (const arg of args) {
    if (arg === "--docker") {
      docker = true;
    } else if (arg === "--no-docker") {
      docker = false;
    }
  }
  if (args.includes("--docker") && args.includes("--no-docker")) {
    console.error(
      pc.red(`Cannot use both ${pc.bold("--docker")} and ${pc.bold("--no-docker")}.`),
    );
    process.exit(1);
  }
  return docker;
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

const resolveAuthChoice = async (): Promise<AuthChoice> => {
  const fromFlag = getAuthFlag();
  if (fromFlag !== undefined) {
    p.log.info(pc.dim(`Auth: ${fromFlag} (--auth)`));
    return fromFlag;
  }

  if (!process.stdin.isTTY) {
    p.log.info(pc.dim("Non-interactive session: Auth set to None."));
    return "none";
  }

  const answer = await p.select({
    message: "Add authentication?",
    options: [
      {
        value: "clerk" as const,
        label: "Clerk",
        hint: "Sign in / Sign up / protected routes",
      },
      {
        value: "none" as const,
        label: "None",
        hint: "Skip auth overlay",
      },
    ],
    initialValue: "none" as const,
  });

  if (p.isCancel(answer)) {
    p.cancel("Operation cancelled.");
    process.exit(1);
  }

  return answer;
};

const resolveEnvChoice = async (): Promise<EnvChoice> => {
  const fromFlag = getEnvFlag();
  if (fromFlag !== undefined) {
    p.log.info(pc.dim(`Env validation: ${fromFlag === "t3" ? "T3 Env + Zod" : "none"} (--env)`));
    return fromFlag;
  }

  if (!process.stdin.isTTY) {
    p.log.info(pc.dim("Non-interactive session: Env validation set to none."));
    return "none";
  }

  const answer = await p.select({
    message: "Environment variable validation?",
    options: [
      {
        value: "t3" as const,
        label: "T3 Env + Zod",
        hint: "Type-safe process.env via src/env.ts",
      },
      {
        value: "none" as const,
        label: "None",
        hint: "Skip env validation overlay",
      },
    ],
    initialValue: "none" as const,
  });

  if (p.isCancel(answer)) {
    p.cancel("Operation cancelled.");
    process.exit(1);
  }

  return answer;
};

const resolveLinterChoice = async (): Promise<LinterChoice> => {
  const fromFlag = getLinterFlag();
  if (fromFlag !== undefined) {
    p.log.info(pc.dim(`Linter: ${fromFlag} (--linter)`));
    return fromFlag;
  }

  if (!process.stdin.isTTY) {
    p.log.info(pc.dim("Non-interactive session: Linter set to ESLint (CNA default)."));
    return "eslint";
  }

  const answer = await p.select({
    message: "Linter / formatter?",
    options: [
      {
        value: "oxlint" as const,
        label: "Oxlint + Oxfmt",
        hint: "Ultracite presets; replaces ESLint",
      },
      {
        value: "eslint" as const,
        label: "ESLint (CNA default)",
        hint: "Keep create-next-app linter",
      },
    ],
    initialValue: "eslint" as const,
  });

  if (p.isCancel(answer)) {
    p.cancel("Operation cancelled.");
    process.exit(1);
  }

  return answer;
};

const resolveDockerChoice = async (): Promise<boolean> => {
  const fromFlag = getDockerFlag();
  if (fromFlag !== undefined) {
    p.log.info(pc.dim(`Docker: ${fromFlag ? "yes" : "no"} (--docker/--no-docker)`));
    return fromFlag;
  }

  if (!process.stdin.isTTY) {
    p.log.info(pc.dim("Non-interactive session: Docker set to no."));
    return false;
  }

  const answer = await p.confirm({
    message: "Would you like to use Docker?",
    initialValue: false,
  });

  if (p.isCancel(answer)) {
    p.cancel("Operation cancelled.");
    process.exit(1);
  }

  return answer;
};

const resolveFeatures = (
  auth: AuthChoice,
  env: EnvChoice,
  linter: LinterChoice,
  useDocker: boolean,
): FeatureId[] => {
  const features: FeatureId[] = [];
  if (auth === "clerk") {
    features.push("clerk-auth");
  }
  if (linter === "oxlint") {
    features.push("oxlint-oxfmt");
  }
  if (useDocker) {
    features.push("docker");
  }
  if (env === "t3") {
    features.push("t3-env");
  }
  return features;
};

const nextStepsFor = (
  projectName: string,
  auth: AuthChoice,
  env: EnvChoice,
  linter: LinterChoice,
  useDocker: boolean,
): string => {
  const lines: string[] = [`cd ${projectName}`];

  if (env === "t3" || auth === "clerk") {
    lines.push("cp .env.example .env.local");
  }

  if (env === "t3") {
    lines.push(
      "Add env vars in .env.local; extend schemas in src/env.ts for new variables",
    );
  }

  if (auth === "clerk") {
    lines.push("Add Clerk keys from https://dashboard.clerk.com");
  }

  lines.push("npm install", "npm run dev");

  if (auth === "clerk") {
    lines.push(
      "",
      "Optional: enable Magic Links, MFA, Social, Passkeys in the Clerk Dashboard.",
    );
  }

  if (env === "t3") {
    lines.push(
      "",
      "Env (T3 Env + Zod): import { env } from \"@/env\" instead of process.env",
    );
  }

  if (linter === "oxlint") {
    lines.push(
      "",
      "Lint / format (Oxlint + Oxfmt via Ultracite; ESLint was replaced):",
      "  npm run lint",
      "  npm run format",
    );
  }

  if (useDocker) {
    lines.push(
      "",
      "Docker (production image; local npm run dev still works without it):",
      `  npm run docker:build`,
      `  npm run docker:run`,
      "Pass runtime secrets with docker run -e / --env-file (do not bake .env into the image).",
    );
  }

  return lines.join("\n");
};

const main = async (): Promise<void> => {
  p.intro(pc.bgCyan(pc.black(` ${PACKAGE_NAME} `)));

  const projectName = await resolveProjectName();
  const auth = await resolveAuthChoice();
  const env = await resolveEnvChoice();
  const linter = await resolveLinterChoice();
  const useDocker = await resolveDockerChoice();
  const features = resolveFeatures(auth, env, linter, useDocker);
  const targetDir = path.resolve(process.cwd(), projectName);

  const spinner = p.spinner();
  spinner.start(`Scaffolding ${pc.cyan(projectName)}…`);

  try {
    await scaffoldProject({
      projectName,
      description: DEFAULT_DESCRIPTION,
      targetDir,
      features,
    });
    spinner.stop(`Created ${pc.green(`./${projectName}`)}`);
  } catch (error) {
    spinner.stop(pc.red("Scaffold failed"));
    throw error;
  }

  p.note(nextStepsFor(projectName, auth, env, linter, useDocker), "Next steps");

  p.outro(pc.green(`Done! Your app is ready in ./${projectName}`));
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
