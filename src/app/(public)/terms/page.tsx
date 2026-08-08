import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default function TermsPage() {
  return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <Breadcrumbs />
        <h1 className="text-4xl font-black">Terms of Use</h1>
        <div className="mt-6 space-y-4 text-slate-300">
          <p>
            FC26 Auction is provided for custom league entertainment and squad-building events. By using the
            platform you agree to follow your league admin&apos;s auction rules.
          </p>
          <p>
            <strong>Fair bidding:</strong> managers must bid within assigned budgets and room access rules.
          </p>
          <p>
            <strong>Admin authority:</strong> admins may pause, skip, reset, or end rooms to keep auction night
            fair and on schedule.
          </p>
          <p>
            <strong>Availability:</strong> live features depend on the production server being online. Free-tier
            hosting may sleep after inactivity.
          </p>
          <p>
            <strong>No official EA affiliation:</strong> player names and ratings are used for league simulation
            purposes only.
          </p>
        </div>
      </Container>
    </section>
  );
}
