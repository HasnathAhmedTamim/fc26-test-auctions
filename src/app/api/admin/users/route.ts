import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import {
  createUserRecord,
  deleteUserById,
  findUserById,
  listUsers,
  updateUserRecord,
  userExistsByEmail,
} from "@/services/user.service";

type UserRole = "admin" | "manager";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const db = await getDb();
  const users = await listUsers(db);

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const name = String(body?.name ?? "").trim();
  const email = normalizeEmail(String(body?.email ?? ""));
  const password = String(body?.password ?? "");
  const role = (body?.role === "admin" ? "admin" : "manager") as UserRole;

  if (name.length < 3) {
    return NextResponse.json({ error: "Name must be at least 3 characters" }, { status: 400 });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const db = await getDb();

  if (await userExistsByEmail(db, email)) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await createUserRecord(db, { name, email, passwordHash, role });

  return NextResponse.json({
    message: "User created",
    user: { id: userId, name, email, role },
  });
}

export async function PATCH(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const userId = String(body?.userId ?? "").trim();
  const name = body?.name !== undefined ? String(body.name).trim() : undefined;
  const email = body?.email !== undefined ? normalizeEmail(String(body.email)) : undefined;
  const role = body?.role !== undefined
    ? ((body.role === "admin" ? "admin" : "manager") as UserRole)
    : undefined;
  const password = body?.password !== undefined ? String(body.password) : undefined;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (name !== undefined && name.length < 3) {
    return NextResponse.json({ error: "Name must be at least 3 characters" }, { status: 400 });
  }

  if (email !== undefined && (!email || !/^\S+@\S+\.\S+$/.test(email))) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (password !== undefined && password !== "" && password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const db = await getDb();
  const existing = await findUserById(db, userId);
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const currentAdminId = access.session.user.id;
  if (role === "manager" && String(existing._id) === currentAdminId) {
    return NextResponse.json({ error: "You cannot demote your own account" }, { status: 400 });
  }

  if (email && email !== existing.email && (await userExistsByEmail(db, email, userId))) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const patch: Partial<{ name: string; email: string; passwordHash: string; role: UserRole }> = {};
  if (name !== undefined) patch.name = name;
  if (email !== undefined) patch.email = email;
  if (role !== undefined) patch.role = role;
  if (password && password !== "") {
    patch.passwordHash = await bcrypt.hash(password, 10);
  }

  await updateUserRecord(db, userId, patch);

  return NextResponse.json({ message: "User updated" });
}

export async function DELETE(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const userId = String(body?.userId ?? "").trim();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (userId === access.session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const db = await getDb();
  const deleted = await deleteUserById(db, userId);
  if (!deleted) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "User deleted" });
}
