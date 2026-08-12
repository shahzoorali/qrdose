import { z } from "zod";
import { US_TIMEZONE_VALUES } from "./timezones";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  phone: z.string().trim().min(1, "Phone number is required"),
  address: z.string().trim().min(1, "Street address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(2, "State is required").max(2),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(1, "Phone number is required"),
  // Optional: only used to email missed-dose escalations.
  email: z
    .union([z.string().trim().toLowerCase().email("Enter a valid email"), z.literal("")])
    .optional(),
});

export const medicationSchema = z.object({
  name: z.string().trim().min(1, "Medication name is required").max(100),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time as HH:MM"),
  enabled: z.boolean().optional(),
});

export const reminderSettingsSchema = z.object({
  remindersEnabled: z.boolean(),
  reminderGraceMinutes: z
    .number()
    .int("Enter a whole number of minutes")
    .min(5, "Use at least 5 minutes")
    .max(720, "Use 720 minutes (12 hours) or less"),
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
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(2).optional(),
  zip: z.string().trim().regex(/^(\d{5}(-\d{4})?)?$/, "Enter a valid ZIP code").optional(),
});

export const adminPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const accountStatusSchema = z.object({
  status: z.enum(["active", "disabled"], {
    message: "Status must be active or disabled",
  }),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type MedicationInput = z.infer<typeof medicationSchema>;
export type ReminderSettingsInput = z.infer<typeof reminderSettingsSchema>;
