import { AuthForm } from "@/components/auth/auth-form";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";
import { PublicFooter } from "@/components/public-footer";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

interface SignupPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeRedirectPath(params.next);

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
            Sign up
          </h1>
          <p className={`${optionBClassNames.body} text-[var(--song-text-muted)]`}>
            Create your account to have a personal backup of your chords.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--song-border)] bg-[var(--song-surface)] p-6 shadow-[var(--song-shadow)]">
          <AuthForm mode="signup" nextPath={nextPath} />
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
