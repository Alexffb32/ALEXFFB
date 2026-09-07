const { Resend } = require("resend");

const AUDIENCE_IDS = {
  newsletter: process.env.RESEND_AUDIENCE_ID_NEWSLETTER,
};

const CONFIRMATION_COPY = {
  newsletter: {
    subject: "Estás na newsletter!",
    html: (firstName) =>
      `<p>Olá ${escapeHtml(firstName)},</p><p>Obrigado por entrares na newsletter. Aviso-te por aqui sempre que houver novidades — Merch, Comunidade, Produtos Digitais, Apps & Software, ou o que vier a seguir.</p><p>Alexandre Bento</p>`,
  },
};

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Adds a subscriber to the Resend audience matching `list`, and sends a
 * short confirmation email. Returns { configured: false } (no-op) when
 * RESEND_API_KEY or the matching audience ID isn't set, so the form keeps
 * working end-to-end before those are configured — see .env.example.
 */
async function subscribeToWaitlist({ name, email, list }) {
  const resend = getClient();
  const audienceId = AUDIENCE_IDS[list];

  if (!resend || !audienceId) {
    console.warn(
      `[waitlist] RESEND_API_KEY or the audience ID for "${list}" is not set — skipping email service call.`,
    );
    return { configured: false };
  }

  const [firstName, ...rest] = name ? name.split(" ") : [undefined];

  await resend.contacts.create({
    email,
    firstName,
    lastName: rest.join(" ") || undefined,
    audienceId,
    unsubscribed: false,
  });

  const fromEmail = process.env.RESEND_FROM_EMAIL || "Alexandre Bento <no-reply@alexffb.com>";
  const copy = CONFIRMATION_COPY[list];

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: copy.subject,
    html: copy.html(firstName || "aí"),
  });

  return { configured: true };
}

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = { subscribeToWaitlist };
