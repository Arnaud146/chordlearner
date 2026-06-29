import { AuthForm } from "@/components/auth/auth-form";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";
import { PublicFooter } from "@/components/public-footer";
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
      className={`${optionBDisplayFont.variable} ${optionBBodyFont.variable} flex min-h-[calc(100vh-8rem)] flex-col`}
    >
      <div className="mx-auto grid max-w-xl flex-1 gap-6 py-8 text-[var(--song-text)]">
        <div className="space-y-2 text-center">
          <p
            className={`${optionBClassNames.body} text-xs font-semibold uppercase tracking-[0.14em] text-[var(--song-text-subtle)]`}
          >
            Member area
          </p>
          <h1 className={`${optionBClassNames.display} text-5xl font-bold md:text-6xl`}>
            Log in
          </h1>
          <p className={`${optionBClassNames.body} text-[var(--song-text-muted)]`}>
            Log in to find your songs and your saved chords again.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--song-border)] bg-[var(--song-surface)] p-6 shadow-[var(--song-shadow)]">
          <AuthForm
            mode="login"
            nextPath={nextPath}
            initialMessage={initialMessage}
            initialError={initialError}
          />
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
