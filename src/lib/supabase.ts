import { createClient } from "@supabase/supabase-js";

/**
 * Read-restricted (insert-only via RLS) client for logging waitlist
 * submissions as a backup registry alongside Resend. Uses the publishable
 * key, which is safe to be public — the `waitlist_submissions` table's RLS
 * policy allows INSERT only, no SELECT, so this key can never read data
 * back even if exposed client-side.
 */
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

/**
 * Logs a waitlist signup into `waitlist_submissions` as a backup registry
 * alongside Resend. Best-effort: a failure here is logged but never blocks
 * the request — Resend (or the lack of credentials) is the source of truth
 * for whether the signup "succeeded" from the visitor's point of view.
 */
export async function logWaitlistSubmission({
  name,
  email,
  list,
  locale,
}: {
  name: string;
  email: string;
  list: "comunidade" | "merch";
  locale: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn(
      "[waitlist] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — skipping Supabase log. See .env.example.",
    );
    return;
  }

  const { error } = await supabase
    .from("waitlist_submissions")
    .insert({ name, email, list, locale });

  if (error) {
    console.error("[waitlist] failed to log submission to Supabase", error);
  }
}
