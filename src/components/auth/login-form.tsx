"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedCallbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
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
        ? new URL(result.url, window.location.origin).pathname
        : safeCallbackUrl;

      router.push(destination);
      router.refresh();
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
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400/60"
        />
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