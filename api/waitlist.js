const { waitlistSchema } = require("./_lib/validation");
const { rateLimit } = require("./_lib/rateLimit");
const { subscribeToWaitlist } = require("./_lib/email");
const { logWaitlistSubmission } = require("./_lib/supabase");

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

  try {
    await subscribeToWaitlist({
      name: parsed.data.name,
      email: parsed.data.email,
      list: parsed.data.list,
    });
  } catch (error) {
    console.error("[api/waitlist] failed to subscribe", error);
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "Something went wrong. Please try again later." }));
    return;
  }

  await logWaitlistSubmission({
    name: parsed.data.name,
    email: parsed.data.email,
    list: parsed.data.list,
  });

  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
};
