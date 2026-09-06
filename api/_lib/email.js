const { Resend } = require("resend");

const AUDIENCE_IDS = {
  merch: process.env.RESEND_AUDIENCE_ID_MERCH,
  comunidade: process.env.RESEND_AUDIENCE_ID_COMUNIDADE,
  "produtos-digitais": process.env.RESEND_AUDIENCE_ID_PRODUTOS_DIGITAIS,
  apps: process.env.RESEND_AUDIENCE_ID_APPS,
};

const CONFIRMATION_COPY = {
  merch: {
    subject: "Estás na waitlist da Merch!",
    html: (firstName) =>
      `<p>Olá ${escapeHtml(firstName)},</p><p>Obrigado por entrares na waitlist da Anti University Social Club. Vais ser dos primeiros a saber quando a coleção abrir, dia 7 de setembro.</p><p>Alexandre Bento</p>`,
  },
  comunidade: {
    subject: "Estás na waitlist da Comunidade!",
    html: (firstName) =>
      `<p>Olá ${escapeHtml(firstName)},</p><p>Obrigado por entrares na waitlist da Comunidade. Aviso-te assim que abrir.</p><p>Alexandre Bento</p>`,
  },
  "produtos-digitais": {
    subject: "Estás na waitlist dos Produtos Digitais!",
    html: (firstName) =>
      `<p>Olá ${escapeHtml(firstName)},</p><p>Obrigado por entrares na waitlist dos cursos, ebooks e templates. Aviso-te assim que houver novidades.</p><p>Alexandre Bento</p>`,
  },
  apps: {
    subject: "Estás na waitlist das Apps & Software!",
    html: (firstName) =>
      `<p>Olá ${escapeHtml(firstName)},</p><p>Obrigado por entrares na waitlist das apps e ferramentas. Aviso-te assim que houver novidades.</p><p>Alexandre Bento</p>`,
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
