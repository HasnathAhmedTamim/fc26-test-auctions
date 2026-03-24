import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { loginSchema } from "@/lib/validations";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) return null;
        const normalizedEmail = parsed.data.email.trim().toLowerCase();

        const db = await getDb();
        const users = db.collection("users");

        const user = await users.findOne({ email: normalizedEmail });
        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!isPasswordValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const incomingRole = (user as { role?: unknown }).role;
        token.role = incomingRole === "admin" || incomingRole === "manager"
          ? incomingRole
          : "manager";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "admin" | "manager") ?? "manager";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const vercelUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : undefined;
      const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
      const rawAppUrl =
        normalizedBaseUrl
        || process.env.AUTH_URL
        || process.env.NEXTAUTH_URL
        || process.env.NEXT_PUBLIC_APP_URL
        || vercelUrl
        || baseUrl;
      const appUrl = rawAppUrl.replace(/\/$/, "");

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
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});