const AUTH_PATHS = new Set(["/login", "/register"]);

function normalizePathname(path: string): string {
  const withoutQuery = path.split("?")[0]?.split("#")[0] ?? path;
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

/**
 * Validates and returns a safe internal post-auth path.
 * Rejects protocol-relative URLs and auth pages to avoid redirect loops.
 */
export function getSafePath(path?: string | string[]): string | undefined {
  const value = Array.isArray(path) ? path[0] : path;

  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return undefined;
  }

  const pathname = normalizePathname(trimmed);
  if (AUTH_PATHS.has(pathname)) {
    return undefined;
  }

  return trimmed;
}

export function getDefaultAuthenticatedPath(role?: "admin" | "manager"): string {
  return role === "admin" ? "/admin" : "/dashboard";
}

export function resolvePostAuthPath(
  callbackUrl: string | undefined,
  role?: "admin" | "manager"
): string {
  return getSafePath(callbackUrl) ?? getDefaultAuthenticatedPath(role);
}
