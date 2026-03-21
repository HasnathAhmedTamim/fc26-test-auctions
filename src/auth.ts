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
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});