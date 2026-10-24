import { z } from 'zod';

/** Mirrors the backend CreateContactDto so users see errors before submitting. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.email('Please enter a valid email address').max(254),
  subject: z.string().trim().max(160).optional(),
  message: z
    .string()
    .trim()
    .min(10, 'Your message should be at least 10 characters')
    .max(5000, 'Please keep it under 5000 characters'),
});

export type ContactInput = z.infer<typeof contactSchema>;
