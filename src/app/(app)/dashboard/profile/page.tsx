import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import { toObjectId } from "@/lib/db/object-id";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const db = await getDb();
  const userObjectId = toObjectId(session.user.id);
  const user = await db.collection("users").findOne(
    userObjectId ? { _id: userObjectId } : { _id: session.user.id as never },
    { projection: { name: 1, email: 1, role: 1 } }
  );

  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-3xl font-black">Profile</h1>
      <p className="mt-2 text-slate-400">Update your manager account details.</p>
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <ProfileForm
          initial={{
            name: String(user.name ?? session.user.name ?? ""),
            email: String(user.email ?? session.user.email ?? ""),
            role: String(user.role ?? session.user.role ?? "manager"),
          }}
        />
      </div>
    </div>
  );
}
