"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

type SettingsPayload = {
  roundTimeSeconds: number;
  bidIncrement: number;
  bidCooldownMs: number;
  activeEdition: string;
};

export function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editions, setEditions] = useState<string[]>([]);

  const [roundTimeSeconds, setRoundTimeSeconds] = useState("120");
  const [bidIncrement, setBidIncrement] = useState("10");
  const [bidCooldownMs, setBidCooldownMs] = useState("500");
  const [activeEdition, setActiveEdition] = useState("fc24");

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to load settings");
        return;
      }

      const settings = (data.settings ?? {}) as Partial<SettingsPayload>;
      setRoundTimeSeconds(String(settings.roundTimeSeconds ?? 120));
      setBidIncrement(String(settings.bidIncrement ?? 10));
      setBidCooldownMs(String(settings.bidCooldownMs ?? 500));
      setActiveEdition(String(settings.activeEdition ?? "fc24"));
      setEditions(Array.isArray(data.editions) ? data.editions.map((item: unknown) => String(item)) : []);
    } catch {
      setError("Failed to load settings. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundTimeSeconds: Number(roundTimeSeconds),
          bidIncrement: Number(bidIncrement),
          bidCooldownMs: Number(bidCooldownMs),
          activeEdition,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error ?? "Failed to save settings";
        setError(message);
        await showErrorAlert("Save failed", message);
        return;
      }

      await showSuccessAlert("Settings updated", "New defaults are now active.");
      await loadSettings();
    } catch {
      const message = "Failed to save settings. Please try again.";
      setError(message);
      await showErrorAlert("Save failed", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Admin Settings</h1>
        <p className="mt-2 text-slate-400">
          Control auction defaults and the active player edition from one place.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {loading ? (
          <p className="text-sm text-slate-400">Loading settings...</p>
        ) : (
          <form onSubmit={saveSettings} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="round-time-seconds" className="mb-1 block text-sm text-slate-300">Round Timer (seconds)</label>
                <input
                  id="round-time-seconds"
                  type="number"
                  min={15}
                  max={600}
                  value={roundTimeSeconds}
                  onChange={(event) => setRoundTimeSeconds(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">Applied when rooms start and when a new player is set.</p>
              </div>

              <div>
                <label htmlFor="bid-increment" className="mb-1 block text-sm text-slate-300">Bid Increment</label>
                <input
                  id="bid-increment"
                  type="number"
                  min={1}
                  max={1000}
                  value={bidIncrement}
                  onChange={(event) => setBidIncrement(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">Every new bid must increase by this step size.</p>
              </div>

              <div>
                <label htmlFor="bid-cooldown-ms" className="mb-1 block text-sm text-slate-300">Bid Cooldown (ms)</label>
                <input
                  id="bid-cooldown-ms"
                  type="number"
                  min={0}
                  max={10000}
                  value={bidCooldownMs}
                  onChange={(event) => setBidCooldownMs(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">Minimum delay between bids from the same manager.</p>
              </div>

              <div>
                <label htmlFor="active-player-edition" className="mb-1 block text-sm text-slate-300">Active Player Edition</label>
                <select
                  id="active-player-edition"
                  value={activeEdition}
                  onChange={(event) => setActiveEdition(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                >
                  {editions.length === 0 ? (
                    <option value="">No editions found</option>
                  ) : (
                    editions.map((edition) => (
                      <option key={edition} value={edition}>
                        {edition}
                      </option>
                    ))
                  )}
                </select>
                <p className="mt-1 text-xs text-slate-500">Used by player APIs and player detail page.</p>
              </div>
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={saving || loading}
                className="bg-emerald-500 text-black hover:bg-emerald-400"
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => void loadSettings()}
                disabled={saving || loading}
              >
                Refresh
              </Button>
            </div>
          </form>
        )}
      </div>
    </Container>
  );
}