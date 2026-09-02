const { Resend } = require("resend");

const AUDIENCE_IDS = {
  comunidade: process.env.RESEND_AUDIENCE_ID_COMUNIDADE,
  merch: process.env.RESEND_AUDIENCE_ID_MERCH,
  newsletter: process.env.RESEND_AUDIENCE_ID_NEWSLETTER,
};

const CONFIRMATION_COPY = {
  comunidade: {
    subject: "You're on the Community waitlist!",
    html: (firstName) =>
      `<p>Hi ${escapeHtml(firstName)},</p><p>Thanks for joining the Community waitlist. You'll be among the first to know when it opens.</p><p>— Alex</p>`,
  },
  merch: {
    subject: "You're on the Merch waitlist!",
    html: (firstName) =>
      `<p>Hi ${escapeHtml(firstName)},</p><p>Thanks for joining the Merch waitlist. We'll let you know as soon as the drop is ready.</p><p>— Alex</p>`,
  },
  newsletter: {
    subject: "You're subscribed!",
    html: (firstName) =>
      `<p>Hi ${escapeHtml(firstName)},</p><p>Thanks for subscribing. Keep an eye on your inbox for the next issue.</p><p>— Alex</p>`,
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
      `[waitlist] RESEND_API_KEY or RESEND_AUDIENCE_ID_${list.toUpperCase()} is not set — skipping email service call.`,
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

  const fromEmail = process.env.RESEND_FROM_EMAIL || "Alex Bento <no-reply@alexffb.com>";
  const copy = CONFIRMATION_COPY[list];

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: copy.subject,
    html: copy.html(firstName || "there"),
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
