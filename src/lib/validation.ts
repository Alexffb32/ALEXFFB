import { z } from "zod";

// Shared name+email validation for the waitlist forms (frontend via
// react-hook-form + zodResolver, and again server-side in the API route —
// never trust client-side validation alone).
export const waitlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(100, "Name is too long")
    .regex(/^[\p{L}\p{M}\s'.-]+$/u, "Name contains invalid characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5)
    .max(254)
    .email("Invalid email address"),
  list: z.enum(["comunidade", "merch"]),
  // Honeypot field: real users never fill this in; bots that auto-fill every
  // input do. Silently reject instead of telling bots why.
  company: z.string().max(0).optional().or(z.literal("")),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(100, "Name is too long"),
  email: z.string().trim().toLowerCase().min(5).max(254).email("Invalid email address"),
  message: z.string().trim().min(10, "Message is too short").max(5000, "Message is too long"),
  company: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;
