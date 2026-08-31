"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(nextLocale: AppLocale) {
    if (typeof document !== "undefined") {
      document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000`;
    }
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center gap-1 rounded-full border border-line bg-white/60 p-1 text-xs font-medium"
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchTo(loc)}
          aria-pressed={locale === loc}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors ${
            locale === loc
              ? "bg-ink text-paper"
              : "text-stone hover:text-ink"
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
