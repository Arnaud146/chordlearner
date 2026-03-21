import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Le pseudo doit contenir au moins 2 caracteres")
    .max(40, "Le pseudo ne peut pas depasser 40 caracteres"),
  fullName: z
    .string()
    .trim()
    .max(80, "Le nom complet ne peut pas depasser 80 caracteres")
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
