"use client";

import { FormEvent, useMemo, useState } from "react";
import { optionBClassNames } from "@/components/option-b/theme";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileDto = {
  displayName: string;
  fullName: string | null;
};

interface ProfileFormProps {
  initialDisplayName: string;
  initialFullName: string | null;
}

function normalizeFullName(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { data?: T; error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Une erreur est survenue");
  }
  if (!payload.data) {
    throw new Error("Reponse API invalide");
  }
  return payload.data;
}

export function ProfileForm({ initialDisplayName, initialFullName }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [savedDisplayName, setSavedDisplayName] = useState(initialDisplayName);
  const [savedFullName, setSavedFullName] = useState(initialFullName ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasChanges = useMemo(() => {
    const normalizedCurrentDisplayName = displayName.trim();
    const normalizedCurrentFullName = normalizeFullName(fullName);
    const normalizedSavedFullName = normalizeFullName(savedFullName);

    return (
      normalizedCurrentDisplayName !== savedDisplayName ||
      normalizedCurrentFullName !== normalizedSavedFullName
    );
  }, [displayName, fullName, savedDisplayName, savedFullName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          fullName: normalizeFullName(fullName),
        }),
      });

      const updatedProfile = await parseApiResponse<ProfileDto>(response);
      setSavedDisplayName(updatedProfile.displayName);
      setSavedFullName(updatedProfile.fullName ?? "");
      setDisplayName(updatedProfile.displayName);
      setFullName(updatedProfile.fullName ?? "");
      setSuccessMessage("Profil mis a jour.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de mettre a jour le profil.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {successMessage ? (
        <Alert className="border border-emerald-700/20 bg-emerald-50 text-emerald-900">
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="profile-display-name" className={`${optionBClassNames.body} text-[var(--song-text)]`}>
          Pseudo
        </Label>
        <Input
          id="profile-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Exemple: ArnaudPiano"
          minLength={2}
          maxLength={40}
          disabled={isSubmitting}
          required
          className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)]`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-full-name" className={`${optionBClassNames.body} text-[var(--song-text)]`}>
          Nom complet (optionnel)
        </Label>
        <Input
          id="profile-full-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Exemple: Arnaud Dupont"
          maxLength={80}
          disabled={isSubmitting}
          className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)]`}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !hasChanges}
        className={`${optionBClassNames.body} rounded-xl bg-[var(--song-accent)] px-5 font-semibold text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent)]/90`}
      >
        {isSubmitting ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
