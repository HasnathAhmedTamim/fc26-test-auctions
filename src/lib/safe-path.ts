/**
 * Validates and returns a safe internal path.
 * Only allows paths that:
 * - Start with /
 * - Don't start with // (prevents protocol-relative URLs)
 *
 * @param path - The path to validate (can be string, string[], or undefined)
 * @returns The safe path, or undefined if invalid
 */
export function getSafePath(path?: string | string[]): string | undefined {
  const value = Array.isArray(path) ? path[0] : path;

  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  return trimmed.startsWith("/") && !trimmed.startsWith("//")
    ? trimmed
    : undefined;
}
