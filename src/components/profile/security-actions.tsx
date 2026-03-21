"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { optionBClassNames } from "@/components/option-b/theme";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface SecurityActionsProps {
  userEmail: string | null;
}

function buildRecoveryRedirectUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", "/profil");
  return url.toString();
}

export function SecurityActions({ userEmail }: SecurityActionsProps) {
  const router = useRouter();
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isSigningOutLocal, setIsSigningOutLocal] = useState(false);
  const [isSigningOutGlobal, setIsSigningOutGlobal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleResetPassword() {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!userEmail) {
      setErrorMessage("Email non disponible pour reinitialiser le mot de passe.");
      return;
    }

    setIsSendingReset(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: buildRecoveryRedirectUrl(),
      });
      if (error) throw error;
      setSuccessMessage("Un email de reinitialisation a ete envoye.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer l'email de reinitialisation.",
      );
    } finally {
      setIsSendingReset(false);
    }
  }

  async function handleSignOut(scope: "local" | "global") {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (scope === "local") {
      setIsSigningOutLocal(true);
    } else {
      setIsSigningOutGlobal(true);
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signOut({ scope });
      if (error) throw error;
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Deconnexion impossible.");
      if (scope === "local") {
        setIsSigningOutLocal(false);
      } else {
        setIsSigningOutGlobal(false);
      }
    }
  }

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={handleResetPassword}
          disabled={isSendingReset}
          className={`${optionBClassNames.body} rounded-xl bg-[var(--song-accent)] px-4 text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent)]/90`}
        >
          {isSendingReset ? "Envoi..." : "Envoyer un email de reinitialisation"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => void handleSignOut("local")}
          disabled={isSigningOutLocal || isSigningOutGlobal}
          className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface)] text-[var(--song-text)] hover:bg-[var(--song-surface-muted)]`}
        >
          {isSigningOutLocal ? "Deconnexion..." : "Se deconnecter de cet appareil"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => void handleSignOut("global")}
          disabled={isSigningOutGlobal || isSigningOutLocal}
          className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface)] text-[var(--song-text)] hover:bg-[var(--song-surface-muted)]`}
        >
          {isSigningOutGlobal ? "Deconnexion..." : "Se deconnecter de tous les appareils"}
        </Button>
      </div>
    </div>
  );
}
