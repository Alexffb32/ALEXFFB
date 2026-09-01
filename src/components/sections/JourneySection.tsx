import { useTranslations } from "next-intl";

type JourneyItem = { year: string; org: string; role: string; body: string };

export default function JourneySection() {
  const t = useTranslations("Journey");
  const items = t.raw("items") as JourneyItem[];

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          {t("kicker")}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {t("title")}
        </h2>

        <ol className="mt-12 space-y-10 border-l border-line pl-8">
          {items.map((item) => (
            <li key={item.year} className="relative">
              <span className="absolute -left-[calc(2rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
              <p className="text-sm font-semibold uppercase tracking-widest text-stone-light">
                {item.year}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-ink">
                {item.org} <span className="text-stone">— {item.role}</span>
              </h3>
              <p className="mt-2 max-w-2xl leading-relaxed text-stone">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
