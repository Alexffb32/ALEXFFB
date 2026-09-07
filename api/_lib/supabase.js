const { createClient } = require("@supabase/supabase-js");

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Logs a waitlist signup into `waitlist_submissions` as a backup registry
 * alongside Resend. Best-effort: a failure here is logged but never blocks
 * the response. Always called regardless of whether the Resend call
 * succeeded — resendOk/resendError record that outcome so a Resend-side
 * failure (bad API key, unverified domain, etc.) leaves a durable,
 * queryable trace here instead of only a Vercel function log line.
 * The table's RLS policy only allows INSERT, never SELECT.
 */
async function logWaitlistSubmission({ name, email, list, consent, resendOk, resendError }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn(
      "[waitlist] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — skipping Supabase log.",
    );
    return;
  }

  const { error } = await supabase
    .from("waitlist_submissions")
    .insert({ name, email, list, consent, resend_ok: resendOk, resend_error: resendError });
  if (error) {
    console.error("[waitlist] failed to log submission to Supabase", error);
  }
}

/**
 * Same idea as logWaitlistSubmission, for the contact form.
 */
async function logContactSubmission({ name, email, message, consent, resendOk, resendError }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn(
      "[contact] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — skipping Supabase log.",
    );
    return;
  }

  const { error } = await supabase
    .from("contact_submissions")
    .insert({ name, email, message, consent, resend_ok: resendOk, resend_error: resendError });
  if (error) {
    console.error("[contact] failed to log submission to Supabase", error);
  }
}

/**
 * Logs a "Comprar pelo WhatsApp" order from the loja. No personal data is
 * collected here — name/morada são trocados diretamente no WhatsApp entre
 * o cliente e o Alexandre — só o conteúdo do carrinho, para haver um
 * registo de encomendas mesmo que a conversa de WhatsApp se perca.
 */
async function logShopOrder({ items, total, comboSavings, resendOk, resendError }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn(
      "[shop-order] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — skipping Supabase log.",
    );
    return;
  }

  const { error } = await supabase.from("shop_orders").insert({
    items,
    total,
    combo_savings: comboSavings,
    resend_ok: resendOk,
    resend_error: resendError,
  });
  if (error) {
    console.error("[shop-order] failed to log order to Supabase", error);
  }
}

module.exports = { logWaitlistSubmission, logContactSubmission, logShopOrder };
