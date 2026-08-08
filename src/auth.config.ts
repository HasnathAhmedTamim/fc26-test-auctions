import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config shared by middleware and the full auth handler.
 * Do not import MongoDB, bcrypt, or other Node-only modules here.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "admin" | "manager") ?? "manager";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const appUrl = baseUrl.replace(/\/$/, "");

      if (url.startsWith("/")) {
        return `${appUrl}${url}`;
      }

      try {
        const target = new URL(url);
        const allowed = new URL(appUrl);

        if (target.origin === allowed.origin) {
          return url;
        }

        return appUrl;
      } catch {
        return appUrl;
      }
    },
  },
} satisfies NextAuthConfig;
