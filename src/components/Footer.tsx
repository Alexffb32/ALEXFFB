import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site";

export default function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-ink text-paper">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-sm uppercase tracking-widest text-accent">{t("kicker")}</p>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="mt-3 block text-2xl font-semibold hover:text-accent"
            >
              {siteConfig.contactEmail}
            </a>
            <p className="mt-4 max-w-sm text-sm text-line-strong">{t("body")}</p>
          </div>

          <nav aria-label={t("columns.site")}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-line-strong">
              {t("columns.site")}
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-accent">
                  {t("links.home")}
                </Link>
              </li>
              <li>
                <Link href={{ pathname: "/", hash: "about" }} className="hover:text-accent">
                  {t("links.about")}
                </Link>
              </li>
              <li>
                <Link href={{ pathname: "/", hash: "services" }} className="hover:text-accent">
                  {t("links.services")}
                </Link>
              </li>
              <li>
                <Link href="/comunidade" className="hover:text-accent">
                  {t("links.community")}
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-accent">
                  {t("links.contact")}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <a
              href="#top"
              className="inline-block rounded-full border border-paper/30 px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
            >
              {t("backToTop")}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-paper/10 pt-6 text-xs text-line-strong sm:flex-row sm:items-center sm:justify-between">
          <p>{t("copyright", { year })}</p>
          <p>Fundão, Portugal 🇵🇹</p>
        </div>
      </div>
    </footer>
  );
}
