import { z } from "zod";
import { US_TIMEZONE_VALUES } from "./timezones";

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

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  timezone: z.enum(US_TIMEZONE_VALUES as [string, ...string[]], {
    message: "Choose a valid US timezone",
  }),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().min(1, "Phone number is required"),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
