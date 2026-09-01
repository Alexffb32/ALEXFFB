import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ContactCtaSection() {
  const t = useTranslations("ContactCta");

  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto max-w-content px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          {t("eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{t("title")}</h2>
        <p className="mt-4 text-xl font-semibold text-line-strong">{t("subtitle")}</p>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-line-strong">{t("body")}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-medium text-line-strong">
          <span className="rounded-full border border-paper/20 px-4 py-1.5">{t("badge1")}</span>
          <span className="rounded-full border border-paper/20 px-4 py-1.5">{t("badge2")}</span>
        </div>

        <Link
          href="/contacto"
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
