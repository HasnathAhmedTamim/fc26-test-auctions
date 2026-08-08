import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { WhatsAppContactForm } from "@/components/contact/whatsapp-contact-form";
import { buildWhatsAppUrl, hasWhatsApp, siteConfig } from "@/lib/site-config";

export default function ContactPage() {
  const quickMessage = buildWhatsAppUrl("Hi, I need help with FC26 Auction.");

  return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <Breadcrumbs />
        <h1 className="text-4xl font-black">Contact</h1>
        <p className="mt-4 text-slate-300">
          Questions about room setup, player imports, or auction night support? Send us a message.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <WhatsAppContactForm />
        </div>

        {hasWhatsApp() && quickMessage ? (
          <p className="mt-6 text-sm text-slate-400">
            Or message us directly:{" "}
            <a
              href={quickMessage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:text-emerald-200"
            >
              +{siteConfig.whatsappNumber.replace(/\D/g, "")}
            </a>
          </p>
        ) : null}
      </Container>
    </section>
  );
}
