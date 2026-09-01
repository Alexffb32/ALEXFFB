import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const photos = [
  { src: "/images/photography/horse.webp", altKey: "horse" },
  { src: "/images/photography/paris.jpg", altKey: "paris" },
  { src: "/images/photography/town-square.jpg", altKey: "townSquare" },
  { src: "/images/photography/friends-night.jpg", altKey: "friendsNight" },
  { src: "/images/photography/on-stage.jpeg", altKey: "onStage" },
  { src: "/images/photography/lisbon-bridge.png", altKey: "lisbonBridge" },
  { src: "/images/photography/gym.jpg", altKey: "gym" },
] as const;

export default function PhotographySection() {
  const t = useTranslations("Photography");

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          {t("eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-stone">{t("body")}</p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.src}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-paper-muted"
            >
              <Image
                src={photo.src}
                alt={t(`alt.${photo.altKey}`)}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>

        <Link
          href="/contacto"
          className="mt-10 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
