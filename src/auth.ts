import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/mongodb";
import { toObjectId } from "@/lib/db/object-id";
import { loginSchema } from "@/lib/validations";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const incomingRole = (user as { role?: unknown }).role;
        token.role = incomingRole === "admin" || incomingRole === "manager"
          ? incomingRole
          : "manager";
        return token;
      }

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
  },
});
