import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default function PrivacyPage() {
  return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <Breadcrumbs />
        <h1 className="text-4xl font-black">Privacy Policy</h1>
        <div className="prose prose-invert mt-6 max-w-none space-y-4 text-slate-300">
          <p>FC26 Auction stores account and league data needed to run live auctions.</p>
          <p>
            <strong>Account data:</strong> name, email, hashed password, and role (manager/admin).
          </p>
          <p>
            <strong>Auction data:</strong> bids, sold players, budgets, lineups, room access, and admin audit
            logs.
          </p>
          <p>
            <strong>Usage:</strong> data is used only to operate the platform for your league. We do not sell
            personal data.
          </p>
          <p>
            <strong>Retention:</strong> league admins control how long rooms and stats remain in MongoDB.
          </p>
          <p>
            <strong>Contact:</strong> use the Contact page for privacy questions.
          </p>
        </div>
      </Container>
    </section>
  );
}
