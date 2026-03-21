"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  nextPath: string;
  initialMessage?: string | null;
  initialError?: string | null;
}

export function AuthForm({
  mode,
  nextPath,
  initialMessage = null,
  initialError = null,
}: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace(nextPath);
        router.refresh();
        return;
      }

      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          nextPath,
        }),
      });
      const signupPayload = (await signupRes.json()) as {
        data?: { hasSession: boolean; message: string | null };
        error?: string;
      };
      if (!signupRes.ok || !signupPayload.data) {
        throw new Error(signupPayload.error ?? "Inscription impossible");
      }

      if (signupPayload.data.hasSession) {
        router.replace(nextPath);
        router.refresh();
        return;
      }

      setSuccessMessage(signupPayload.data.message ?? "Inscription terminee.");
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : "";
      const safeMessages: Record<string, string> = {
        "Invalid login credentials": "Email ou mot de passe incorrect.",
        "Email not confirmed": "Verifie ton e-mail pour confirmer l'inscription.",
        "User already registered": "Un compte existe deja avec cet email.",
      };
      setErrorMessage(
        safeMessages[rawMsg] ?? "Erreur d'authentification. Reessaye plus tard.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="toi@email.com"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-password`}>Mot de passe</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 caracteres"
          disabled={isSubmitting}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-[#2d2a24] text-[#f8f4ea] hover:bg-[#2d2a24]/90"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Chargement..."
          : mode === "login"
            ? "Se connecter"
            : "Creer mon compte"}
      </Button>

      <p className="text-center text-sm text-[#5a5246]">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="underline">
              S&apos;inscrire
            </Link>
          </>
        ) : (
          <>
            Deja un compte ?{" "}
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="underline">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
