import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { loginSchema } from "@/lib/validations";

// Safely parse string IDs when tokens need to query Mongo _id fields.
function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}
// NextAuth's built-in CSRF protection and secure cookie handling mitigate common vulnerabilities like CSRF and session hijacking.
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
        // Normalize email so login is case-insensitive and whitespace-tolerant.
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
        return token;
      }

      // Keep role in sync with DB so manual role changes are reflected in live sessions.
      if (token.sub) {
        const db = await getDb();
        const users = db.collection("users");
        const userObjectId = toObjectId(token.sub);

        if (userObjectId) {
          const persistedUser = await users.findOne(
            { _id: userObjectId },
            { projection: { role: 1 } }
          );

          token.role = persistedUser?.role === "admin" ? "admin" : "manager";
        }
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

        // Prevent open redirects by allowing only same-origin absolute URLs.
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