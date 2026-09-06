const { z } = require("zod");
const { Resend } = require("resend");
const { rateLimit } = require("./_lib/rateLimit");
const { logContactSubmission } = require("./_lib/supabase");

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100, "Name is too long"),
  email: z.string().trim().toLowerCase().min(5).max(254).email("Invalid email address"),
  message: z.string().trim().min(1, "Message is empty").max(5000, "Message is too long"),
  // Honeypots mirroring the native form's hidden anti-bot fields — accepted
  // by the schema so a filled one doesn't surface as a validation error;
  // the handler checks them and silently no-ops.
  company: z.string().optional(),
  website: z.string().optional(),
});

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed." }));
    return;
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const { success } = rateLimit(`contact:${ip}`);
  if (!success) {
    res.statusCode = 429;
    res.end(JSON.stringify({ error: "Too many requests. Please try again in a minute." }));
    return;
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Invalid request body." }));
    return;
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({ error: "Invalid input.", issues: parsed.error.flatten().fieldErrors }),
    );
    return;
  }

  if (parsed.data.company || parsed.data.website) {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL;

  if (!apiKey || !to) {
    console.warn(
      "[contact] RESEND_API_KEY or CONTACT_NOTIFY_EMAIL is not set — skipping email notification.",
    );
    await logContactSubmission({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      resendOk: null,
      resendError: "RESEND_API_KEY or CONTACT_NOTIFY_EMAIL not set",
    });
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  let resendOk = true;
  let resendError = null;
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Alexandre Bento <no-reply@alexffb.com>",
      to,
      replyTo: parsed.data.email,
      subject: `Nova mensagem de contacto de ${parsed.data.name}`,
      html:
        `<p><strong>Nome:</strong> ${escapeHtml(parsed.data.name)}</p>` +
        `<p><strong>Email:</strong> ${escapeHtml(parsed.data.email)}</p>` +
        `<p><strong>Mensagem:</strong></p><p>${escapeHtml(parsed.data.message).replace(/\n/g, "<br>")}</p>`,
    });
  } catch (error) {
    console.error("[api/contact] failed to send notification email", error);
    resendOk = false;
    resendError = error && error.message ? error.message : String(error);
  }

  await logContactSubmission({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    resendOk,
    resendError,
  });

  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
};
