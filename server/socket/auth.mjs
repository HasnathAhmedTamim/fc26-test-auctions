import { getToken } from "next-auth/jwt";

function usesSecureCookies() {
  if (process.env.NODE_ENV === "production") return true;

  const baseUrl =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    "";

  return baseUrl.startsWith("https://");
}

export function createSocketAuthMiddleware() {
  return async (socket, nextAuthDone) => {
    try {
      const token = await getToken({
        req: {
          headers: {
            cookie: socket.handshake.headers?.cookie ?? "",
          },
        },
        secret: process.env.AUTH_SECRET,
        secureCookie: usesSecureCookies(),
      });

      if (!token?.sub) {
        return nextAuthDone(new Error("Unauthorized"));
      }

      const role = token.role === "admin" ? "admin" : "manager";
      socket.data.user = {
        id: String(token.sub),
        role,
        name: String(token.name ?? "Unknown"),
      };

      return nextAuthDone();
    } catch (error) {
      console.error("Socket auth failed:", error);
      return nextAuthDone(new Error("Unauthorized"));
    }
  };
}
