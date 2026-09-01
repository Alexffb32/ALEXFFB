import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function HeroSection() {
  const t = useTranslations("Hero");

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {t("greeting")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone">{t("intro")}</p>
          <div className="mt-8">
            <Link
              href="/contacto"
              className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("cta")}
            </Link>
          </div>
        </div>

        {/* Hero image — untouched per project constraints (same file, unmodified). */}
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl bg-paper-muted lg:max-w-none">
          <Image
            src="/images/hero-alex.png"
            alt="Alex Bento wearing a suit and sunglasses on a street in Portugal at sunset"
            fill
            priority
            sizes="(min-width: 1024px) 480px, 90vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
