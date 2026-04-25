"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showErrorAlert, showInfoAlert, showSuccessAlert } from "@/lib/alerts";
import { getSafePath } from "@/lib/safe-path";

type RegisterFormProps = {
  callbackUrl?: string;
};

// This component handles user registration with client-side validation, error handling, and automatic sign-in after successful account creation for a seamless onboarding experience.
export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isProcessing = submitting || isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (name.trim().length < 3) {
      setError("Name must be at least 3 characters");
      return;
    }

    if (email.trim().length === 0 || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Prevent double submit with explicit state lock
    if (isProcessing) return;
    setSubmitting(true);

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        let data;
        try {
          data = await res.json();
        } catch {
          setError("Unexpected server response");
          await showErrorAlert("Error", "Server returned an invalid response");
          return;
        }

        if (!res.ok) {
          // Handle multiple backend error response formats
          const message = data?.error || data?.message || "Registration failed";
          setError(message);
          await showErrorAlert("Registration failed", message);
          return;
        }

        // Auto sign-in streamlines onboarding right after successful account creation.
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError("Account created, but sign in failed. Please login manually");
          await showInfoAlert(
            "Account created",
            "Please login manually. Automatic sign-in could not be completed."
          );
          router.replace("/login");
          return;
        }

        await showSuccessAlert("Account ready", "Welcome to FC26 Auction.");
        const safeDestination = getSafePath(callbackUrl) ?? "/dashboard";
        router.replace(safeDestination);
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Manager Name</span>
        <input
          type="text"
          disabled={isProcessing}
          required
          minLength={3}
          autoComplete="name"
          placeholder="Your team manager name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400/60 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Email</span>
        <input
          type="email"
          disabled={isProcessing}
          required
          autoComplete="email"
          placeholder="manager@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400/60 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Password</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            disabled={isProcessing}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 pr-12 outline-none focus:border-emerald-400/60 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            disabled={isProcessing}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-200 focus-visible:text-slate-200 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <Button
        disabled={isProcessing}
        className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
      >
        {isProcessing ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}