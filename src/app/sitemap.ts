import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site";

const paths = ["/", "/contacto", "/comunidade", "/merch"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((pathname) => ({
    url: `${siteConfig.url}${getPathname({ locale: routing.defaultLocale, href: pathname })}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [
          locale,
          `${siteConfig.url}${getPathname({ locale, href: pathname })}`,
        ]),
      ),
    },
  }));
}
