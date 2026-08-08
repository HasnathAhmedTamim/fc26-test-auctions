import { auth } from "@/auth";
import { HeroSection } from "@/components/home/hero-section";
import { FeatureSection } from "@/components/home/feature-section";
import { HomeWinnerBanner } from "@/components/home/home-winner-banner";
import { HomeHowItWorks } from "@/components/home/home-how-it-works";
import { HomeLiveStats } from "@/components/home/home-live-stats";
import { HomeFeaturedPlayers } from "@/components/home/home-featured-players";
import { HomeBenefits } from "@/components/home/home-benefits";
import { HomeFaq } from "@/components/home/home-faq";
import { HomeFinalCta } from "@/components/home/home-final-cta";
import { getFeaturedPlayers, getHomeLiveStats } from "@/lib/home/get-home-data";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const role = session?.user?.role === "admin" ? "admin" : session?.user?.role === "manager" ? "manager" : undefined;

  const [stats, featuredPlayers] = await Promise.all([getHomeLiveStats(), getFeaturedPlayers(6)]);

  return (
    <>
      <HeroSection isLoggedIn={isLoggedIn} role={role} />
      <HomeWinnerBanner />
      <FeatureSection />
      <HomeHowItWorks />
      <HomeLiveStats stats={stats} />
      <HomeFeaturedPlayers players={featuredPlayers} />
      <HomeBenefits />
      <HomeFaq />
      <HomeFinalCta isLoggedIn={isLoggedIn} role={role} />
    </>
  );
}
