"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const requestedCallbackUrl = callbackUrl ?? "/dashboard";
  const safeCallbackUrl = requestedCallbackUrl.startsWith("/")
    && !requestedCallbackUrl.startsWith("//")
    ? requestedCallbackUrl
    : "/dashboard";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: safeCallbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password");
        await showErrorAlert("Login failed", "Invalid email or password.");
        return;
      }

      await showSuccessAlert("Welcome back", "Redirecting to your dashboard...");

      const destination = result?.url
        ? new URL(result.url, window.location.origin).toString()
        : safeCallbackUrl;

      window.location.assign(destination);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            autoComplete="current-password"
            placeholder="Enter your password"
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
        {isPending ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}