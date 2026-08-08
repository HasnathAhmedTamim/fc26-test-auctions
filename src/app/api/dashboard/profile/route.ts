import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { toObjectId } from "@/lib/db/object-id";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const userObjectId = toObjectId(session.user.id);
  const user = await db.collection("users").findOne(
    userObjectId ? { _id: userObjectId } : { _id: session.user.id as never },
    { projection: { name: 1, email: 1, role: 1 } }
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: String(user.name ?? ""),
    email: String(user.email ?? ""),
    role: String(user.role ?? "manager"),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body?.name ?? "").trim();
  const password = String(body?.password ?? "");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (password && password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const db = await getDb();
  const userObjectId = toObjectId(session.user.id);
  const update: Record<string, unknown> = {
    name,
    updatedAt: new Date(),
  };

  if (password) {
    update.passwordHash = await bcrypt.hash(password, 10);
  }

  const result = await db.collection("users").updateOne(
    userObjectId ? { _id: userObjectId } : { _id: session.user.id as never },
    { $set: update }
  );

  if (!result.matchedCount) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Profile updated", name });
}
