"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, User } from "lucide-react";
import { showConfirmAlert } from "@/lib/alerts";

export function ProfileMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session?.user) return null;

  async function handleLogout() {
    const confirmed = await showConfirmAlert("Sign out now?", "You will need to sign in again.");
    if (!confirmed) return;
    await signOut({ redirect: false, callbackUrl: "/" });
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <User size={16} />
        <span className="max-w-[100px] truncate">{session.user.name}</span>
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[180px] rounded-xl border border-white/10 bg-slate-950 p-2 shadow-xl"
        >
          <Link
            href="/dashboard/profile"
            role="menuitem"
            className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/players/compare"
            role="menuitem"
            className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            Compare Players
          </Link>
          {session.user.role === "admin" ? (
            <Link
              href="/admin"
              role="menuitem"
              className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              Admin Panel
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleLogout()}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
