import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Normalize email to avoid duplicate accounts that differ only by case.
    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    const db = await getDb();
    const users = db.collection("users");

    const existing = await users.findOne({ email: normalizedEmail });

    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Cost factor 10 balances baseline security and API responsiveness.
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const result = await users.insertOne({
      name: parsed.data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "manager",
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "User created successfully",
      userId: result.insertedId.toString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}