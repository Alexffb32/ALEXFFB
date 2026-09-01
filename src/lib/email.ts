import { Resend } from "resend";

export type WaitlistList = "comunidade" | "merch";

const AUDIENCE_IDS: Record<WaitlistList, string | undefined> = {
  comunidade: process.env.RESEND_AUDIENCE_ID_COMUNIDADE,
  merch: process.env.RESEND_AUDIENCE_ID_MERCH,
};

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Adds a subscriber to the audience/list matching `list`, and sends a short
 * confirmation email. Each waitlist page maps to its own Resend Audience ID
 * so /comunidade and /merch signups never mix.
 *
 * Returns { configured: false } (and does nothing) when RESEND_API_KEY isn't
 * set yet, so the app keeps working end-to-end in development before Alex
 * supplies real credentials — see .env.example.
 */
export async function subscribeToWaitlist({
  name,
  email,
  list,
  locale,
}: {
  name: string;
  email: string;
  list: WaitlistList;
  locale: string;
}): Promise<{ configured: boolean }> {
  const resend = getClient();
  const audienceId = AUDIENCE_IDS[list];

  if (!resend || !audienceId) {
    console.warn(
      `[waitlist] RESEND_API_KEY or RESEND_AUDIENCE_ID_${list.toUpperCase()} is not set — skipping email service call. See .env.example.`,
    );
    return { configured: false };
  }

  const [firstName, ...rest] = name.split(" ");

  await resend.contacts.create({
    email,
    firstName,
    lastName: rest.join(" ") || undefined,
    audienceId,
    unsubscribed: false,
  });

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Alex Bento <hello@alexffb.com>";
  const copy = confirmationCopy(list, locale);

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: copy.subject,
    html: copy.html(firstName || name),
  });

  return { configured: true };
}

/**
 * Forwards a contact-form submission to Alex's inbox. Requires
 * RESEND_API_KEY and a verified sender in RESEND_FROM_EMAIL; when either is
 * missing this is a no-op (logged), same as subscribeToWaitlist above.
 */
export async function sendContactMessage({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}): Promise<{ configured: boolean }> {
  const resend = getClient();
  if (!resend) {
    console.warn("[contact] RESEND_API_KEY is not set — skipping email send. See .env.example.");
    return { configured: false };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Alex Bento <hello@alexffb.com>";
  const toEmail = process.env.CONTACT_EMAIL_TO ?? "contact@alexffb.com";

  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    replyTo: email,
    subject: `New contact form message from ${name}`,
    html: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
  });

  return { configured: true };
}

function confirmationCopy(list: WaitlistList, locale: string) {
  const isPt = locale === "pt";

  if (list === "comunidade") {
    return {
      subject: isPt ? "Estás na lista da Comunidade!" : "You're on the Community waitlist!",
      html: (firstName: string) =>
        isPt
          ? `<p>Olá ${escapeHtml(firstName)},</p><p>Obrigado por te juntares à lista de espera da Comunidade. Assim que abrirmos as inscrições, és dos primeiros a saber.</p><p>— Alex</p>`
          : `<p>Hi ${escapeHtml(firstName)},</p><p>Thanks for joining the Community waitlist. You'll be among the first to know when it opens.</p><p>— Alex</p>`,
    };
  }

  return {
    subject: isPt ? "Estás na lista do Merch!" : "You're on the Merch waitlist!",
    html: (firstName: string) =>
      isPt
        ? `<p>Olá ${escapeHtml(firstName)},</p><p>Obrigado por te juntares à lista de espera do Merch. Avisamos-te assim que o lançamento estiver pronto.</p><p>— Alex</p>`
        : `<p>Hi ${escapeHtml(firstName)},</p><p>Thanks for joining the Merch waitlist. We'll let you know as soon as the drop is ready.</p><p>— Alex</p>`,
  };
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
