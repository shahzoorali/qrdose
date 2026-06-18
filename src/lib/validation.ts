import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  phone: z.string().trim().min(1, "Phone number is required"),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(1, "Phone number is required"),
});

export const messageSchema = z.object({
  notificationMessage: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(280, "Keep it under 280 characters"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
