import { AuthForm } from "@/components/auth/auth-form";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";
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
      className={`${optionBDisplayFont.variable} ${optionBBodyFont.variable} mx-auto grid max-w-xl gap-6 bg-[#f8f4ea] text-[#2d2a24]`}
    >
      <div className="space-y-2 text-center">
        <p
          className={`${optionBClassNames.body} text-xs font-semibold tracking-[0.14em] text-[#8e8068] uppercase`}
        >
          Espace membre
        </p>
        <h1 className={`${optionBClassNames.display} text-5xl font-bold md:text-6xl`}>
          Inscription
        </h1>
        <p className={`${optionBClassNames.body} text-[#5a5246]`}>
          Cree ton compte pour avoir une sauvegarde personnelle de tes accords.
        </p>
      </div>

      <div className="border border-[#d9ccb2] bg-white p-6">
        <AuthForm mode="signup" nextPath={nextPath} />
      </div>
    </div>
  );
}
