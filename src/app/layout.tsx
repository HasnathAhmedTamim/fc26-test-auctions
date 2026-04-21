import type { Metadata } from "next";
import { Bebas_Neue, Sora } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthSessionProvider } from "@/components/providers/session-provider";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "FC26 Auction",
  description: "Build your squad, bid live, dominate the tournament.",
};

// Wraps the app with shared providers and global navigation/footer chrome.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${bebasNeue.variable} min-h-screen bg-slate-950 text-white antialiased`}>
        <AuthSessionProvider>
          <Navbar />
          <main className="relative z-10">{children}</main>
          <Footer />
        </AuthSessionProvider>
      </body>
    </html>
  );
}