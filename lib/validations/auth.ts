import { z } from "zod";

import { optionalUrl } from "@/lib/validations/shared";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .max(254, "That email address is too long.")
  .email("Enter a valid email address.");

const fullName = z.string().trim().min(2, "Enter your full name.").max(100, "Use 100 characters or fewer.");

const newPassword = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.");

const confirmationMatches = (values: { password: string; confirmPassword: string }) =>
  values.password === values.confirmPassword;

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(72, "That password is too long."),
});

export const signUpSchema = z
  .object({
    fullName,
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine(confirmationMatches, { path: ["confirmPassword"], message: "Passwords don’t match." });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine(confirmationMatches, { path: ["confirmPassword"], message: "Passwords don’t match." });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(72),
    password: newPassword,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine(confirmationMatches, { path: ["confirmPassword"], message: "Passwords don’t match." })
  .refine((values) => values.password !== values.currentPassword, {
    path: ["password"],
    message: "Choose a password you’re not already using.",
  });

export const profileSchema = z.object({
  fullName,
  phone: z
    .string()
    .trim()
    .max(20, "Use 20 characters or fewer.")
    .refine((value) => value === "" || /^[+()\d\s.-]{7,20}$/.test(value), "Enter a valid phone number.")
    .transform((value) => (value === "" ? null : value)),
  avatarUrl: optionalUrl,
});
