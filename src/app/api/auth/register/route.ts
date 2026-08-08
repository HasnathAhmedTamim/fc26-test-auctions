import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { registerSchema } from "@/lib/validations";
import { createUserRecord, userExistsByEmail } from "@/services/user.service";

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

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const db = await getDb();

    if (await userExistsByEmail(db, normalizedEmail)) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const userId = await createUserRecord(db, {
      name: parsed.data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "manager",
    });

    return NextResponse.json({
      message: "User created successfully",
      userId,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
