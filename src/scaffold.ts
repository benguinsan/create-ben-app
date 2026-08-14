import fs from "node:fs/promises";
import path from "node:path";
import { PKG_ROOT } from "./consts";

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".cts",
  ".env",
  ".example",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const SKIP_DIR_NAMES = new Set([".git", ".next", "node_modules"]);

export type FeatureId = "clerk-auth" | "t3-env" | "oxlint-oxfmt" | "docker";

export type ScaffoldOptions = {
  projectName: string;
  description: string;
  /** Absolute path for the new project directory */
  targetDir: string;
  /** Optional feature overlays to merge after `default` */
  features?: FeatureId[];
};

type PackageJson = {
  name?: string;
  description?: string;
  version?: string;
  private?: boolean;
  engines?: Record<string, string>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string | null>;
  devDependencies?: Record<string, string | null>;
  [key: string]: unknown;
};

const SCAFFOLD_RM_FILE = ".scaffold-rm";

export const getDefaultTemplateDir = (): string =>
  path.join(PKG_ROOT, "templates", "default");

export const getFeatureTemplateDir = (featureId: FeatureId): string =>
  path.join(PKG_ROOT, "templates", featureId);

const shouldProcessAsText = (filePath: string): boolean => {
  const base = path.basename(filePath);
  if (base.startsWith(".env")) {
    return true;
  }
  // Dockerfile has no extension but may contain {{placeholders}}
  if (base === "Dockerfile" || base.startsWith("Dockerfile.")) {
    return true;
  }
  if (base === ".dockerignore") {
    return true;
  }
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
};

const applyPlaceholders = (
  input: string,
  placeholders: Record<string, string>,
): string => {
  let output = input;
  for (const [key, value] of Object.entries(placeholders)) {
    output = output.split(`{{${key}}}`).join(value);
  }
  return output;
};

const pathExists = async (dir: string): Promise<boolean> => {
  try {
    await fs.access(dir);
    return true;
  } catch {
    return false;
  }
};

const assertTargetAvailable = async (targetDir: string): Promise<void> => {
  if (!(await pathExists(targetDir))) {
    return;
  }

  const entries = await fs.readdir(targetDir);
  if (entries.length > 0) {
    throw new Error(
      `Target directory already exists and is not empty: ${targetDir}`,
    );
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const mergeStringRecords = (
  base: Record<string, string | null> | undefined,
  overlay: Record<string, string | null> | undefined,
): Record<string, string> | undefined => {
  if (!base && !overlay) {
    return undefined;
  }

  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries(base ?? {})) {
    if (value !== null) {
      merged[key] = value;
    }
  }

  if (!overlay) {
    return merged;
  }

  for (const [key, value] of Object.entries(overlay)) {
    if (value === null) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }

  return merged;
};

const mergePackageJson = (baseRaw: string, overlayRaw: string): string => {
  const base = JSON.parse(baseRaw) as PackageJson;
  const overlay = JSON.parse(overlayRaw) as PackageJson;

  const merged: PackageJson = {
    ...base,
    ...overlay,
    name: base.name,
    description: base.description,
    version: base.version ?? overlay.version,
    private: base.private ?? overlay.private,
    engines: { ...(base.engines ?? {}), ...(overlay.engines ?? {}) },
    scripts: mergeStringRecords(base.scripts, overlay.scripts),
    dependencies: mergeStringRecords(base.dependencies, overlay.dependencies),
    devDependencies: mergeStringRecords(
      base.devDependencies,
      overlay.devDependencies,
    ),
  };

  // Drop empty optional maps for cleaner output
  if (merged.engines && Object.keys(merged.engines).length === 0) {
    delete merged.engines;
  }
  if (merged.scripts && Object.keys(merged.scripts).length === 0) {
    delete merged.scripts;
  }
  if (merged.dependencies && Object.keys(merged.dependencies).length === 0) {
    delete merged.dependencies;
  }
  if (
    merged.devDependencies &&
    Object.keys(merged.devDependencies).length === 0
  ) {
    delete merged.devDependencies;
  }

  // Preserve unknown top-level keys from base that overlay did not set
  for (const [key, value] of Object.entries(base)) {
    if (!(key in merged) && isRecord(value)) {
      merged[key] = value;
    }
  }

  return `${JSON.stringify(merged, null, 2)}\n`;
};

const writeTextFile = async (
  targetPath: string,
  contents: string,
): Promise<void> => {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, contents, "utf8");
};

const copyDir = async (
  sourceDir: string,
  targetDir: string,
  placeholders: Record<string, string>,
  options: { mergePackageJson: boolean },
): Promise<void> => {
  await fs.mkdir(targetDir, { recursive: true });

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetName = applyPlaceholders(entry.name, placeholders);
    const targetPath = path.join(targetDir, targetName);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath, placeholders, options);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    // Control file for post-copy deletions — never copy into the generated app
    if (entry.name === SCAFFOLD_RM_FILE) {
      continue;
    }

    if (
      options.mergePackageJson &&
      entry.name === "package.json" &&
      (await pathExists(targetPath))
    ) {
      const baseRaw = await fs.readFile(targetPath, "utf8");
      const overlayRaw = applyPlaceholders(
        await fs.readFile(sourcePath, "utf8"),
        placeholders,
      );
      await writeTextFile(targetPath, mergePackageJson(baseRaw, overlayRaw));
      continue;
    }

    if (shouldProcessAsText(sourcePath)) {
      const raw = await fs.readFile(sourcePath, "utf8");
      await writeTextFile(targetPath, applyPlaceholders(raw, placeholders));
    } else {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.copyFile(sourcePath, targetPath);
    }
  }
};

const isSafeRelativePath = (relativePath: string): boolean => {
  if (!relativePath || path.isAbsolute(relativePath)) {
    return false;
  }
  const normalized = path.normalize(relativePath);
  if (normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
    return false;
  }
  return true;
};

const applyScaffoldRemovals = async (
  featureDir: string,
  targetDir: string,
): Promise<void> => {
  const rmListPath = path.join(featureDir, SCAFFOLD_RM_FILE);
  if (!(await pathExists(rmListPath))) {
    return;
  }

  const raw = await fs.readFile(rmListPath, "utf8");
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  for (const relativePath of lines) {
    if (!isSafeRelativePath(relativePath)) {
      continue;
    }

    const targetPath = path.join(targetDir, relativePath);
    try {
      await fs.rm(targetPath, { force: true, recursive: true });
    } catch {
      // Ignore missing or already-removed paths
    }
  }

  // Do not leave the control file in the generated app
  try {
    await fs.rm(path.join(targetDir, SCAFFOLD_RM_FILE), { force: true });
  } catch {
    // ignore
  }
};

const overlayFeature = async (
  featureId: FeatureId,
  targetDir: string,
  placeholders: Record<string, string>,
): Promise<void> => {
  const featureDir = getFeatureTemplateDir(featureId);

  if (!(await pathExists(featureDir))) {
    throw new Error(
      `Feature template not found at ${featureDir}. Did you publish/include the templates/ folder?`,
    );
  }

  await copyDir(featureDir, targetDir, placeholders, {
    mergePackageJson: true,
  });
  await applyScaffoldRemovals(featureDir, targetDir);
};

const applyT3EnvClerkVariants = async (
  targetDir: string,
  features: FeatureId[],
): Promise<void> => {
  if (!features.includes("clerk-auth") || !features.includes("t3-env")) {
    return;
  }

  const t3Dir = getFeatureTemplateDir("t3-env");
  const envWithClerk = path.join(t3Dir, "src", "env.with-clerk.ts");
  const envExampleWithClerk = path.join(t3Dir, ".env.example.with-clerk");

  if (await pathExists(envWithClerk)) {
    await fs.copyFile(envWithClerk, path.join(targetDir, "src", "env.ts"));
  }

  if (await pathExists(envExampleWithClerk)) {
    await fs.copyFile(envExampleWithClerk, path.join(targetDir, ".env.example"));
  }
};

export const scaffoldProject = async (
  options: ScaffoldOptions,
): Promise<void> => {
  const templateDir = getDefaultTemplateDir();

  if (!(await pathExists(templateDir))) {
    throw new Error(
      `Template not found at ${templateDir}. Did you publish/include the templates/ folder?`,
    );
  }

  await assertTargetAvailable(options.targetDir);

  const placeholders = {
    name: options.projectName,
    description: options.description,
  };

  await copyDir(templateDir, options.targetDir, placeholders, {
    mergePackageJson: false,
  });

  const features = options.features ?? [];
  for (const featureId of features) {
    await overlayFeature(featureId, options.targetDir, placeholders);
  }

  await applyT3EnvClerkVariants(options.targetDir, features);
};

/** @deprecated Use `scaffoldProject` */
export const scaffoldDefaultTemplate = scaffoldProject;
