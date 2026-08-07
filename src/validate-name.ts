const NPM_NAME_RE =
  /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/**
 * Validate a project / npm package name.
 * Returns an error message, or `undefined` when valid.
 */
export const validateProjectName = (
  value: string | undefined,
): string | undefined => {
  const name = (value ?? "").trim();

  if (name.length === 0) {
    return "Name cannot be empty";
  }

  if (name.length > 214) {
    return "Name is too long (max 214 characters)";
  }

  if (name.startsWith(".") || name.startsWith("_")) {
    return "Name cannot start with '.' or '_'";
  }

  if (name.includes("/") && !name.startsWith("@")) {
    return "Name cannot contain path separators";
  }

  if (!NPM_NAME_RE.test(name)) {
    return 'Name must be a valid npm package name (lowercase, no spaces — e.g. "my-app")';
  }

  return undefined;
};
