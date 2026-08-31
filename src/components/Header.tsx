"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";

export default function Header() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);

  const links = [
    { key: "about", href: { pathname: "/" as const, hash: "about" }, label: t("about") },
    { key: "services", href: { pathname: "/" as const, hash: "services" }, label: t("services") },
    { key: "community", href: "/comunidade" as const, label: t("community") },
    { key: "merch", href: "/merch" as const, label: t("merch") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image
            src="/images/logo.png"
            alt="Alex Bento"
            width={32}
            height={32}
            className="rounded-full"
            priority
          />
          <span className="font-semibold tracking-tight text-ink">Alex Bento</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-stone transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <Link
            href="/contacto"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("contact")}
          </Link>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm font-medium md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t("closeMenu") : t("openMenu")}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="flex flex-col gap-1 border-t border-line bg-paper px-4 py-4 md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone hover:bg-paper-muted hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contacto"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-accent px-4 py-2 text-center text-sm font-semibold text-white"
          >
            {t("contact")}
          </Link>
          <div className="mt-3">
            <LocaleSwitcher />
          </div>
        </nav>
      )}
    </header>
  );
}
