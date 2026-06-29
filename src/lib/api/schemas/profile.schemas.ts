import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(40, "Username cannot exceed 40 characters"),
  fullName: z
    .string()
    .trim()
    .max(80, "Full name cannot exceed 80 characters")
    .nullable()
    .optional(),
});
