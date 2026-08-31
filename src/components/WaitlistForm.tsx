"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const formSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  // Honeypot — real visitors never see or fill this field (visually hidden
  // below); bots that auto-fill every input on the page do.
  company: z.string().max(0).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function WaitlistForm({ list }: { list: "comunidade" | "merch" }) {
  const t = useTranslations("Waitlist");
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "rate-limited">(
    "idle",
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  async function onSubmit(values: FormValues) {
    setStatus("submitting");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ ...values, list }),
      });

      if (response.status === 429) {
        setStatus("rate-limited");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        return;
      }

      router.push(`/${list}/confirmado`);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink">
          {t("nameLabel")}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          aria-invalid={!!errors.name}
          className="mt-1 w-full rounded-lg border border-line-strong px-4 py-2.5 text-ink placeholder:text-stone-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          {...register("name")}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-accent">{t("validation.nameMin")}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={!!errors.email}
          className="mt-1 w-full rounded-lg border border-line-strong px-4 py-2.5 text-ink placeholder:text-stone-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-accent">{t("validation.emailInvalid")}</p>
        )}
      </div>

      {/* Honeypot field — hidden from real users via CSS + tabIndex, not `display:none`
          (some bots skip fields hidden that way), left unlabeled for screen readers. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>

      {status === "error" && <p className="text-sm text-accent">{t("error")}</p>}
      {status === "rate-limited" && <p className="text-sm text-accent">{t("errorTooMany")}</p>}

      <p className="text-xs text-stone-light">{t("privacyNote")}</p>
    </form>
  );
}
