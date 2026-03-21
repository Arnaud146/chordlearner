import { AuthForm } from "@/components/auth/auth-form";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
    message?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeRedirectPath(params.next);
  const initialMessage = params.message ?? null;
  const initialError = params.error ?? null;

  return (
    <div
      className={`${optionBDisplayFont.variable} ${optionBBodyFont.variable} mx-auto grid max-w-xl gap-6 bg-[#f8f4ea] text-[#2d2a24]`}
    >
      <div className="space-y-2 text-center">
        <p
          className={`${optionBClassNames.body} text-xs font-semibold tracking-[0.14em] text-[#8e8068] uppercase`}
        >
          Espace membre
        </p>
        <h1 className={`${optionBClassNames.display} text-5xl font-bold md:text-6xl`}>
          Connexion
        </h1>
        <p className={`${optionBClassNames.body} text-[#5a5246]`}>
          Connecte-toi pour retrouver tes morceaux et tes accords sauvegardes.
        </p>
      </div>

      <div className="border border-[#d9ccb2] bg-white p-6">
        <AuthForm
          mode="login"
          nextPath={nextPath}
          initialMessage={initialMessage}
          initialError={initialError}
        />
      </div>
    </div>
  );
}
