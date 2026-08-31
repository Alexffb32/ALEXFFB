import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import HeroSection from "@/components/sections/HeroSection";
import AboutIntroSection from "@/components/sections/AboutIntroSection";
import JourneySection from "@/components/sections/JourneySection";
import StatsSection from "@/components/sections/StatsSection";
import ServicesSection from "@/components/sections/ServicesSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import PhotographySection from "@/components/sections/PhotographySection";
import StorySection from "@/components/sections/StorySection";
import ContactCtaSection from "@/components/sections/ContactCtaSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.home" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `${siteConfig.url}/${locale}` },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <JsonLd />
      <HeroSection />
      <AboutIntroSection />
      <JourneySection />
      <StatsSection />
      <ServicesSection />
      <BenefitsSection />
      <PhotographySection />
      <StorySection />
      <ContactCtaSection />
    </>
  );
}
