import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LazyVideo from "@/components/LazyVideo";

const videos = [
  { src: "/videos/hero-1.mp4", poster: "/videos/hero-1-poster.jpg" },
  { src: "/videos/hero-2.mp4", poster: "/videos/hero-2-poster.jpg" },
  { src: "/videos/hero-3.mp4", poster: "/videos/hero-3-poster.jpg" },
];

export default function AboutIntroSection() {
  const t = useTranslations("AboutIntro");

  return (
    <section id="about" className="scroll-mt-24 border-b border-line bg-paper-soft">
      <div className="mx-auto grid max-w-content gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            {t("kicker")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-5 max-w-xl leading-relaxed text-stone">{t("body")}</p>
          <Link
            href={{ pathname: "/", hash: "story" }}
            className="mt-6 inline-block text-sm font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4"
          >
            {t("cta")}
          </Link>

          <div className="mt-10 rounded-2xl border border-line bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-light">
              {t("lifestyleLabel")}
            </p>
            <blockquote className="mt-3 text-lg leading-relaxed text-ink">
              {t("lifestyleQuote")}
            </blockquote>
            <p className="mt-4 text-sm font-medium text-accent">{t("lifestyleTagline")}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {videos.map((video) => (
            <div
              key={video.src}
              className="aspect-[9/16] overflow-hidden rounded-2xl bg-paper-muted"
            >
              <LazyVideo
                src={video.src}
                poster={video.poster}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
