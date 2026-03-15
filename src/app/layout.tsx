import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthSessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "FC26 Auction",
  description: "Build your squad, bid live, dominate the tournament.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <AuthSessionProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthSessionProvider>
      </body>
    </html>
  );
}