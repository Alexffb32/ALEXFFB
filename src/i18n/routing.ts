import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pt"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
  pathnames: {
    "/": "/",
    "/contacto": {
      en: "/contact",
      pt: "/contacto",
    },
    "/comunidade": {
      en: "/community",
      pt: "/comunidade",
    },
    "/comunidade/confirmado": {
      en: "/community/confirmed",
      pt: "/comunidade/confirmado",
    },
    "/merch": {
      en: "/merch",
      pt: "/merch",
    },
    "/merch/confirmado": {
      en: "/merch/confirmed",
      pt: "/merch/confirmado",
    },
  },
});

export type AppLocale = (typeof routing.locales)[number];
