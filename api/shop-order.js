const { z } = require("zod");
const { Resend } = require("resend");
const { rateLimit } = require("./_lib/rateLimit");
const { logShopOrder } = require("./_lib/supabase");

const itemSchema = z.object({
  designSlug: z.string().trim().min(1).max(80),
  designName: z.string().trim().min(1).max(120),
  format: z.enum(["tshirt", "hoodie", "combo"]),
  formatLabel: z.string().trim().min(1).max(80),
  color: z.enum(["preto", "branco"]),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
  qty: z.number().int().min(1).max(20),
  unitPrice: z.number().nonnegative().max(1000),
});

const orderSchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
  total: z.number().nonnegative().max(20000),
  comboSavings: z.number().nonnegative().max(20000),
});

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(n) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function orderEmailHtml(data) {
  const rows = data.items
    .map(
      (it) =>
        `<tr>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(it.designName)} — ${escapeHtml(it.formatLabel)}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;">${it.color === "branco" ? "Branco" : "Preto"}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(it.size)}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;">${it.qty}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;">${money(it.unitPrice)}</td>` +
        `</tr>`,
    )
    .join("");

  return (
    `<p>Novo pedido de compra iniciado na loja (Anti University Social Club) — o cliente foi redirecionado para o WhatsApp para concluir.</p>` +
    `<table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">` +
    `<thead><tr>` +
    `<th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;">Produto</th>` +
    `<th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;">Cor</th>` +
    `<th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;">Tamanho</th>` +
    `<th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;">Qtd</th>` +
    `<th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;">Preço unit.</th>` +
    `</tr></thead><tbody>${rows}</tbody></table>` +
    `<p style="margin-top:14px;"><strong>Total: ${money(data.total)}</strong>` +
    (data.comboSavings > 0 ? `<br>Poupança com combos: ${money(data.comboSavings)}` : "") +
    `</p>`
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

  const { success } = rateLimit(`shop-order:${ip}`, { max: 20 });
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

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({ error: "Invalid input.", issues: parsed.error.flatten().fieldErrors }),
    );
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL;

  let resendOk = null;
  let resendError = null;

  if (!apiKey || !to) {
    console.warn(
      "[shop-order] RESEND_API_KEY or CONTACT_NOTIFY_EMAIL is not set — skipping email notification.",
    );
    resendError = "RESEND_API_KEY or CONTACT_NOTIFY_EMAIL not set";
  } else {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Alexandre Bento <no-reply@alexffb.com>",
        to,
        subject: `Nova encomenda da loja — ${money(parsed.data.total)}`,
        html: orderEmailHtml(parsed.data),
      });
      resendOk = true;
    } catch (error) {
      console.error("[api/shop-order] failed to send notification email", error);
      resendOk = false;
      resendError = error && error.message ? error.message : String(error);
    }
  }

  await logShopOrder({
    items: parsed.data.items,
    total: parsed.data.total,
    comboSavings: parsed.data.comboSavings,
    resendOk,
    resendError,
  });

  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
};
