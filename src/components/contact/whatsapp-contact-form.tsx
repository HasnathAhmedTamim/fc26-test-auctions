"use client";

import { useState } from "react";
import { buildWhatsAppUrl, hasWhatsApp } from "@/lib/site-config";
import { showInfoAlert } from "@/lib/alerts";

export function WhatsAppContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    const whatsappUrl = buildWhatsAppUrl(
      `FC26 Auction contact\nName: ${name.trim()}\nEmail: ${email.trim()}\nMessage: ${message.trim()}`
    );

    if (!whatsappUrl) {
      await showInfoAlert(
        "Contact unavailable",
        "Direct messaging is not configured yet. Please reach out to your tournament admin."
      );
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Name</span>
        <input
          required
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400/60"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Message</span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400/60"
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {!hasWhatsApp() ? (
        <p className="text-sm text-slate-400">
          Contact details are not configured yet. Please ask your tournament admin for support.
        </p>
      ) : null}
      <button
        type="submit"
        className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-black hover:bg-emerald-400"
      >
        {hasWhatsApp() ? "Send message" : "Submit inquiry"}
      </button>
    </form>
  );
}
