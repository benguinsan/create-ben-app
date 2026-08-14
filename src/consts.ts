import path from "node:path";

/**
 * Package root (parent of `dist/`).
 * After tsup bundles into `dist/index.js`, templates live at `${PKG_ROOT}/templates`.
 */
export const PKG_ROOT = path.resolve(__dirname, "..");

export const PACKAGE_NAME = "create-ben-app";
export const DEFAULT_APP_NAME = "my-app";
export const DEFAULT_DESCRIPTION = "A project created with create-ben-app";

export const TITLE_TEXT = `
  __  ____   __      _    ____  ____
 |  \\/  \\ \\ / /     / \\  |  _ \\|  _ \\
 | |\\/| |\\ V /     / _ \\ | |_) | |_) |
 | |  | | | |     / ___ \\|  __/|  __/
 |_|  |_| |_|    /_/   \\_\\_|   |_|
`;

export const WELCOME_TAGLINE = "Welcome — let's scaffold your Next.js starter";
