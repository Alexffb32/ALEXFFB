import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type ServiceItem = { title: string; body: string };

export default function ServicesSection() {
  const t = useTranslations("Services");
  const items = t.raw("items") as ServiceItem[];

  return (
    <section id="services" className="scroll-mt-24 border-b border-line">
      <div className="mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              {t("eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-stone">{t("subtitle")}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="rounded-full bg-accent-pale px-3 py-1 text-xs font-semibold text-accent">
              {t("tag1")}
            </span>
            <span className="rounded-full bg-accent-pale px-3 py-1 text-xs font-semibold text-accent">
              {t("tag2")}
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-line p-6">
              <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-stone">{item.body}</p>
            </div>
          ))}
        </div>

        <Link
          href={{ pathname: "/", hash: "about" }}
          className="mt-8 inline-block text-sm font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
