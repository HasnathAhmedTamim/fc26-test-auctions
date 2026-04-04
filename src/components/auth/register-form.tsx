"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showErrorAlert, showInfoAlert, showSuccessAlert } from "@/lib/alerts";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Transition keeps the UI responsive while async register/sign-in requests run.
    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        await showErrorAlert("Registration failed", data.error ?? "Please review your details and try again.");
        return;
      }

      // Auto sign-in streamlines onboarding right after successful account creation.
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created, but sign in failed. Please login manually.");
        await showInfoAlert(
          "Account created",
          "Please login manually. Automatic sign-in could not be completed."
        );
        router.push("/login");
        router.refresh();
        return;
      }

      await showSuccessAlert("Account ready", "Welcome to FC26 Auction.");

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Manager Name</span>
        <input
          type="text"
          required
          minLength={3}
          autoComplete="name"
          placeholder="Your team manager name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400/60"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="manager@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400/60"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Password</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 pr-12 outline-none focus:border-emerald-400/60"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-200 focus-visible:text-slate-200 focus-visible:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <Button
        disabled={isPending}
        className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
      >
        {isPending ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}