import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthRequiredError } from "@/lib/api/require-auth";
import { DatabaseError } from "@/lib/db/helpers";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiValidationError(error: ZodError) {
  const firstIssue = error.issues[0];
  return apiError(firstIssue?.message ?? "Payload invalide", 400);
}

/**
 * Standard error handler for API catch blocks.
 * Handles auth errors, validation errors, DB errors, and generic errors.
 */
export function handleApiError(error: unknown, fallbackMessage: string, fallbackStatus = 500) {
  if (error instanceof AuthRequiredError) {
    return apiError("Authentification requise", 401);
  }
  if (error instanceof ZodError) {
    return apiValidationError(error);
  }
  if (error instanceof DatabaseError) {
    console.error("[db]", error.code, error.message);
    return apiError("Une erreur de base de donnees est survenue", 500);
  }
  return apiError(fallbackMessage, fallbackStatus);
}
