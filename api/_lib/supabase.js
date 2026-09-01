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
 * the response — Resend (or the lack of credentials) is the source of
 * truth for whether the signup "succeeded" from the visitor's point of view.
 * The table's RLS policy only allows INSERT, never SELECT.
 */
async function logWaitlistSubmission({ name, email, list }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn(
      "[waitlist] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — skipping Supabase log.",
    );
    return;
  }

  const { error } = await supabase.from("waitlist_submissions").insert({ name, email, list });
  if (error) {
    console.error("[waitlist] failed to log submission to Supabase", error);
  }
}

module.exports = { logWaitlistSubmission };
