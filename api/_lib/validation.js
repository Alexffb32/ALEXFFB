const { z } = require("zod");

const waitlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(100, "Name is too long")
    .regex(/^[\p{L}\p{M}\s'.-]+$/u, "Name contains invalid characters")
    .optional(),
  email: z.string().trim().toLowerCase().min(5).max(254).email("Invalid email address"),
  // Single general waitlist — all site CTAs point at /newsletter now,
  // rather than one page per pillar with its own Resend audience.
  list: z.enum(["newsletter"]),
  // Must be explicitly true — enforced server-side too, not just via the
  // required checkbox in the UI, since consent is the form's legal basis
  // for processing this data (see /privacidade/).
  consent: z.literal(true, {
    errorMap: () => ({ message: "Tens de aceitar a Política de Privacidade e os Termos e Condições." }),
  }),
  // Honeypot: real visitors never fill this in; bots that auto-fill every
  // input on the page do. Accept any value here (don't reject in the
  // schema) so a filled honeypot doesn't surface as a validation error —
  // the handler checks this field itself and fakes a success response.
  company: z.string().optional(),
});

module.exports = { waitlistSchema };
