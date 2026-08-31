import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { sendContactMessage } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { success } = rateLimit(`contact:${ip}`, { max: 3 });
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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendContactMessage(parsed.data);
  } catch (error) {
    console.error("[api/contact] failed to send", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
