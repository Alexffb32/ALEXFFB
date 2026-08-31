import { NextRequest, NextResponse } from "next/server";
import { waitlistSchema } from "@/lib/validation";
import { subscribeToWaitlist } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { success } = rateLimit(`waitlist:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Honeypot: if the hidden "company" field was filled in, silently pretend
  // success so the bot doesn't learn anything, without adding it anywhere.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  const locale = request.headers.get("x-locale") ?? "en";

  try {
    await subscribeToWaitlist({
      name: parsed.data.name,
      email: parsed.data.email,
      list: parsed.data.list,
      locale,
    });
  } catch (error) {
    console.error("[api/waitlist] failed to subscribe", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
