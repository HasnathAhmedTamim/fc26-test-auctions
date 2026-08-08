import Link from "next/link";
import { auth } from "@/auth";
import { HeroSection } from "@/components/home/hero-section";
import { FeatureSection } from "@/components/home/feature-section";
import { HomeCtaBand } from "@/components/home/home-cta-band";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const role = session?.user?.role === "admin" ? "admin" : session?.user?.role === "manager" ? "manager" : undefined;

  return (
    <>
      <HeroSection isLoggedIn={isLoggedIn} role={role} />
      <FeatureSection />
      <HomeCtaBand isLoggedIn={isLoggedIn} role={role} />
    </>
  );
}
