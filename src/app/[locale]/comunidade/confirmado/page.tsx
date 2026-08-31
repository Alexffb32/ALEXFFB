import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function ComunidadeConfirmedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Waitlist");

  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {t("comunidade.confirmedTitle")}
      </h1>
      <p className="mt-4 leading-relaxed text-stone">{t("comunidade.confirmedBody")}</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {t("backHome")}
      </Link>
    </section>
  );
}
