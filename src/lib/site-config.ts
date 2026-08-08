export const siteConfig = {
  name: "FC26 Auction",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
};

export function hasWhatsApp() {
  return siteConfig.whatsappNumber.replace(/\D/g, "").length > 0;
}

export function buildWhatsAppUrl(message: string) {
  const digits = siteConfig.whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
