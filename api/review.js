const { z } = require("zod");
const { Resend } = require("resend");
const { rateLimit } = require("./_lib/rateLimit");

/* Avaliações da loja (/loja/avaliar/).
 *
 * Nada é publicado automaticamente: a avaliação segue por email, o
 * Alexandre confirma que corresponde a uma encomenda real, e só então a
 * cola em REVIEWS (assets/shop-catalog.js). O email já traz a linha pronta
 * a colar. Publicar sem confirmar seria abrir a porta a avaliações falsas,
 * que a lei proíbe (Diretiva Omnibus) e o Google penaliza.
 */
const reviewSchema = z.object({
  product: z.string().trim().regex(/^[a-z0-9-]{1,80}$/),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(10).max(800),
  name: z.string().trim().min(2).max(60),
  city: z.string().trim().max(60).optional().default(""),
  consent: z.literal(true),
  company: z.string().max(200).optional(),
});

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* Só o primeiro nome vai para a loja — é o que o formulário promete. */
function firstName(name) {
  return name.split(/\s+/)[0];
}

function catalogEntry(data, date) {
  return (
    "{ product: " + JSON.stringify(data.product) +
    ", name: " + JSON.stringify(firstName(data.name)) +
    ", city: " + JSON.stringify(data.city) +
    ", rating: " + data.rating +
    ", date: " + JSON.stringify(date) +
    ", text: " + JSON.stringify(data.text) + " },"
  );
}

function reviewEmailHtml(data, date) {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
  return (
    `<p style="font-family:sans-serif;">Nova avaliação na loja — <strong>por confirmar</strong>.</p>` +
    `<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">` +
    `<tr><td style="padding:4px 12px 4px 0;color:#777;">Peça</td><td>${escapeHtml(data.product)}</td></tr>` +
    `<tr><td style="padding:4px 12px 4px 0;color:#777;">Nota</td><td>${stars} (${data.rating}/5)</td></tr>` +
    `<tr><td style="padding:4px 12px 4px 0;color:#777;">Nome</td><td>${escapeHtml(data.name)}</td></tr>` +
    `<tr><td style="padding:4px 12px 4px 0;color:#777;">Cidade</td><td>${escapeHtml(data.city || "—")}</td></tr>` +
    `</table>` +
    `<blockquote style="font-family:sans-serif;font-size:15px;border-left:3px solid #ff462e;margin:16px 0;padding:4px 14px;">${escapeHtml(
      data.text,
    )}</blockquote>` +
    `<p style="font-family:sans-serif;font-size:13px;">1. Confirma que esta pessoa te comprou esta peça (conversa de WhatsApp).<br>` +
    `2. Cola a linha abaixo dentro de <code>REVIEWS</code> em <code>assets/shop-catalog.js</code>.<br>` +
    `3. Corre <code>node scripts/build-product-pages.js</code> e publica.</p>` +
    `<pre style="background:#f4f4f4;padding:12px;border-radius:6px;white-space:pre-wrap;font-size:12px;">${escapeHtml(
      catalogEntry(data, date),
    )}</pre>`
  );
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

  const { success } = rateLimit(`review:${ip}`, { max: 5 });
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

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({ error: "Invalid input.", issues: parsed.error.flatten().fieldErrors }),
    );
    return;
  }

  // Honeypot: os bots preenchem o campo escondido; finge-se que correu bem.
  if (parsed.data.company) {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  /* Ao contrário da encomenda (que continua no WhatsApp), aqui o email é o
     único sítio para onde a avaliação vai. Se não sair, diz-se ao cliente
     em vez de lhe agradecer por algo que se perdeu. */
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!apiKey || !to) {
    console.warn("[review] RESEND_API_KEY or CONTACT_NOTIFY_EMAIL is not set — review not delivered.");
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "Reviews are not available right now." }));
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Alexandre Bento <no-reply@alexffb.com>",
      to,
      subject: `Nova avaliação (${parsed.data.rating}/5) — ${parsed.data.product}`,
      html: reviewEmailHtml(parsed.data, date),
    });
  } catch (error) {
    console.error("[api/review] failed to send review email", error);
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "Could not send the review." }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
};
