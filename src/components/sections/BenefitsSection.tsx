import { useTranslations } from "next-intl";

type BenefitItem = { title: string; body: string; badge: string };

export default function BenefitsSection() {
  const t = useTranslations("Benefits");
  const items = t.raw("items") as BenefitItem[];

  return (
    <section className="border-b border-line bg-paper-soft">
      <div className="mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          {t("kicker")}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {t("title")}
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-line bg-white p-8">
              <span className="inline-block rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-wide text-paper">
                {item.badge}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-stone">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
