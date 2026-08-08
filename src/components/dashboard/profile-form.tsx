"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

type ProfileData = {
  name: string;
  email: string;
  role: string;
};

export function ProfileForm({ initial }: { initial: ProfileData }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName(initial.name);
  }, [initial.name]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (password && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ...(password ? { password } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const message = data.error ?? "Failed to update profile";
        setError(message);
        await showErrorAlert("Update failed", message);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      await showSuccessAlert("Profile updated", "Your changes have been saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400/60"
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Email</span>
        <input
          value={initial.email}
          disabled
          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-500"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Role</span>
        <input
          value={initial.role}
          disabled
          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-500 capitalize"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">New password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Leave blank to keep current password"
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400/60"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Confirm new password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400/60"
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button disabled={isPending} className="bg-emerald-500 text-black hover:bg-emerald-400">
        {isPending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
