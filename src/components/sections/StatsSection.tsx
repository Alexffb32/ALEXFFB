import { useTranslations } from "next-intl";

type Stat = { label: string; value: string; suffix: string; detail: string };

export default function StatsSection() {
  const t = useTranslations("Stats");
  const businessStats = t.raw("business") as Stat[];
  const realStats = t.raw("real") as Stat[];

  return (
    <section className="border-b border-line bg-paper-soft">
      <div className="mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          {t("kicker")}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-2xl leading-relaxed text-stone">{t("intro")}</p>

        <dl className="mt-12 grid gap-6 sm:grid-cols-3">
          {businessStats.map((stat) => (
            <div key={stat.label} className="border-b border-line pb-6 sm:border-b-0">
              <dd className="text-5xl font-bold text-ink">
                {stat.value}
                <span className="text-accent">{stat.suffix}</span>
              </dd>
              <dt className="mt-3 text-lg font-semibold text-ink">{stat.label}</dt>
              <p className="mt-1 text-sm text-stone-light">{stat.detail}</p>
            </div>
          ))}
        </dl>

        <dl className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {realStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-line bg-white p-6">
              <dt className="text-sm font-medium text-stone">{stat.label}</dt>
              <dd className="mt-2 text-3xl font-bold text-ink">
                {stat.value}
                <span className="text-accent">{stat.suffix}</span>
              </dd>
              <p className="mt-1 text-xs uppercase tracking-wide text-stone-light">
                {stat.detail}
              </p>
            </div>
          ))}
        </dl>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-stone">{t("education")}</p>
      </div>
    </section>
  );
}
