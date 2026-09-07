const { waitlistSchema } = require("./_lib/validation");
const { rateLimit } = require("./_lib/rateLimit");
const { subscribeToWaitlist } = require("./_lib/email");
const { logWaitlistSubmission } = require("./_lib/supabase");

function errorMessage(error) {
  return error && error.message ? error.message : String(error);
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

  const { success } = rateLimit(`waitlist:${ip}`);
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

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({ error: "Invalid input.", issues: parsed.error.flatten().fieldErrors }),
    );
    return;
  }

  // Honeypot: if the hidden "company" field was filled in, silently pretend
  // success so the bot doesn't learn anything, without adding it anywhere.
  if (parsed.data.company) {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // resendOk stays null when Resend isn't configured at all (no API key /
  // audience ID — a deliberate no-op, see subscribeToWaitlist), so that
  // state reads differently in Supabase than an actual failed send.
  let resendOk = null;
  let resendError = null;
  try {
    const result = await subscribeToWaitlist({
      name: parsed.data.name,
      email: parsed.data.email,
      list: parsed.data.list,
    });
    resendOk = result.configured ? true : null;
  } catch (error) {
    console.error("[api/waitlist] failed to subscribe", error);
    resendOk = false;
    resendError = errorMessage(error);
  }

  // Always log — a failed/unconfigured Resend call still leaves a record.
  await logWaitlistSubmission({
    name: parsed.data.name,
    email: parsed.data.email,
    list: parsed.data.list,
    consent: parsed.data.consent,
    resendOk,
    resendError,
  });

  if (resendOk === false) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "Something went wrong. Please try again later." }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
};
