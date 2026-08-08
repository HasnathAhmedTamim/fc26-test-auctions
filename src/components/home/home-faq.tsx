"use client";

import { useState } from "react";
import { Container } from "@/components/layout/container";

const faqs = [
  {
    q: "How do I join an auction room?",
    a: "Register as a manager, then ask your admin to grant access to the room. After that, open Dashboard and join the live room.",
  },
  {
    q: "What happens if I run out of budget?",
    a: "The bid panel blocks amounts above your remaining budget. You can still follow the auction and manage your squad.",
  },
  {
    q: "Can admins change the player catalog?",
    a: "Yes. Admins can import editions and switch the active catalog from Admin Settings.",
  },
  {
    q: "Do I need to stay on the same website URL?",
    a: "Yes. Live bidding only works on the production Node host. Log in on the same domain you use for the auction room.",
  },
];

export function HomeFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-16">
      <Container>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">FAQ</p>
        <h2 className="mt-2 text-3xl font-black">Auction night questions</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={item.q} className="rounded-2xl border border-white/10 bg-white/5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold sm:px-5 sm:text-base"
                >
                  {item.q}
                  <span className="text-emerald-300">{open ? "−" : "+"}</span>
                </button>
                {open ? <p className="border-t border-white/10 px-5 py-4 text-sm text-slate-400">{item.a}</p> : null}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
