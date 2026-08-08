import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default function AboutPage() {
  return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <Breadcrumbs />
        <h1 className="text-4xl font-black">About FC26 Auction</h1>
        <p className="mt-4 text-slate-300">
          FC26 Auction is a live squad-market platform built for custom football leagues. It replaces
          manual spreadsheets with real-time bidding, budget tracking, lineup management, and tournament
          visibility.
        </p>
        <div className="mt-8 space-y-4 text-slate-300">
          <p>
            Managers join assigned auction rooms, bid on players from an imported catalog, and build squads
            within budget and squad-size limits. Admins control rooms, grant access, switch player editions,
            and run the full auction flow.
          </p>
          <p>
            The platform supports multiple player pools such as FC24, FC26, and lower-rated custom lists,
            making it flexible for different league formats.
          </p>
        </div>
        <Link href="/contact" className="mt-8 inline-block text-emerald-300 hover:text-emerald-200">
          Contact us →
        </Link>
      </Container>
    </section>
  );
}
