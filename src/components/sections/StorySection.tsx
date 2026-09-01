import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LazyVideo from "@/components/LazyVideo";

export default function StorySection() {
  const t = useTranslations("Story");

  return (
    <section id="story" className="scroll-mt-24 border-b border-line bg-paper-soft">
      <div className="mx-auto grid max-w-content gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="order-2 aspect-video overflow-hidden rounded-2xl bg-paper-muted lg:order-1">
          <LazyVideo
            src="/videos/story.mp4"
            poster="/videos/story-poster.jpg"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-stone">{t("question")}</h2>
          <h3 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("titleLine1")} {t("titleLine2")}
          </h3>
          <p className="mt-4 text-lg font-semibold text-accent">{t("highlight")}</p>
          <p className="mt-4 leading-relaxed text-stone">{t("body1")}</p>
          <p className="mt-4 leading-relaxed text-stone">{t("body2")}</p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={{ pathname: "/", hash: "services" }}
              className="inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
            >
              {t("cta")}
            </Link>
            <span className="text-sm font-medium text-stone-light">{t("badge")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
