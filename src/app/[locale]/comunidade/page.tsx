import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import WaitlistForm from "@/components/WaitlistForm";
import { siteConfig } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.comunidade" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${siteConfig.url}${getPathname({ locale, href: "/comunidade" })}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          `${siteConfig.url}${getPathname({ locale: l, href: "/comunidade" })}`,
        ]),
      ),
    },
  };
}

export default async function ComunidadePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Waitlist");

  return (
    <section className="mx-auto max-w-xl px-4 py-20 sm:px-6 lg:px-8">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">
        {t("comunidade.kicker")}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {t("comunidade.title")}
      </h1>
      <p className="mt-4 leading-relaxed text-stone">{t("comunidade.body")}</p>

      <div className="mt-10 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <WaitlistForm list="comunidade" />
      </div>
    </section>
  );
}
