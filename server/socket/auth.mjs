import { getToken } from "next-auth/jwt";

export function createSocketAuthMiddleware() {
  return async (socket, nextAuthDone) => {
    try {
      // Authenticate websocket handshakes using the same NextAuth token cookie.
      const token = await getToken({
        req: {
          headers: {
            cookie: socket.handshake.headers?.cookie ?? "",
          },
        },
        secret: process.env.AUTH_SECRET,
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
    } catch {
      return nextAuthDone(new Error("Unauthorized"));
    }
  };
}
