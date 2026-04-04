import { handlers } from "@/auth";

// Forward NextAuth handlers to App Router route exports.
export const { GET, POST } = handlers;