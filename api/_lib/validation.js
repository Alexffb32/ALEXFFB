const { z } = require("zod");

const waitlistSchema = z.object({
  // Optional: the Newsletter page's slim subscribe bar only asks for an
  // email (lower friction, standard for a newsletter signup) — Comunidade
  // and Merch still collect it for personalized confirmation emails.
  name: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(100, "Name is too long")
    .regex(/^[\p{L}\p{M}\s'.-]+$/u, "Name contains invalid characters")
    .optional(),
  email: z.string().trim().toLowerCase().min(5).max(254).email("Invalid email address"),
  list: z.enum(["comunidade", "merch", "newsletter"]),
  // Honeypot: real visitors never fill this in; bots that auto-fill every
  // input on the page do. Accept any value here (don't reject in the
  // schema) so a filled honeypot doesn't surface as a validation error —
  // the handler checks this field itself and fakes a success response.
  company: z.string().optional(),
});

module.exports = { waitlistSchema };
