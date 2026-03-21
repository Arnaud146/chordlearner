import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  optionBBodyFont,
  optionBClassNames,
  optionBDisplayFont,
} from "@/components/option-b/theme";
import { cn } from "@/lib/utils";

export default async function LandingPage() {
  /* Piano keys: active keys form a C major chord (C-E-G) */
  const pianoKeys: { active: boolean; label?: string }[] = [
    { active: false },
    { active: false },
    { active: true, label: "C" },
    { active: false },
    { active: false },
    { active: true, label: "E" },
    { active: false },
    { active: true, label: "G" },
    { active: false },
    { active: false },
    { active: false },
    { active: false },
    { active: true, label: "C" },
    { active: false },
  ];

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/songs");
  } catch {
    // not logged in — show landing page
  }

  return (
    <div
      className={cn(
        "relative left-1/2 -my-8 w-screen -translate-x-1/2 overflow-x-hidden bg-[#f8f4ea] text-[#2d2a24]",
        optionBDisplayFont.variable,
        optionBBodyFont.variable,
      )}
    >
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#2d2a24] pb-0 pt-16 md:pt-20">
        {/* Decorative glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-[600px] -translate-x-1/2 rounded-full bg-[#5a5246]/20 blur-[120px]"
        />

        <div className="relative mx-auto max-w-5xl px-6 pb-16 text-center md:pb-20">
          <p
            className={cn(
              "mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#a89a80]",
              optionBClassNames.body,
            )}
          >
            L&apos;app piano pour maitriser tes accords
          </p>

          <h1
            className={cn(
              "mx-auto max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-[#f8f4ea] md:text-8xl",
              optionBClassNames.display,
            )}
          >
            Joue tes morceaux
            <br />
            <span className="bg-gradient-to-r from-[#d9ccb2] to-[#8e8068] bg-clip-text text-transparent">
              au piano
            </span>
          </h1>

          <p
            className={cn(
              "mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#a89a80] md:text-xl",
              optionBClassNames.body,
            )}
          >
            Importe une grille d&apos;accords, decouvre les voicings sur le
            clavier et transpose en un clic. Gratuit.
          </p>

          <div
            className={cn(
              "mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row",
              optionBClassNames.body,
            )}
          >
            <Link
              href="/signup"
              className="inline-flex h-14 items-center rounded-md bg-[#f8f4ea] px-10 text-base font-bold text-[#2d2a24] shadow-lg shadow-black/20 transition-all hover:bg-white hover:shadow-xl hover:shadow-black/30"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/login"
              className="inline-flex h-14 items-center rounded-md border border-[#5a5246] px-10 text-base font-semibold text-[#c4b697] transition-all hover:border-[#8e8068] hover:text-[#f8f4ea]"
            >
              J&apos;ai deja un compte
            </Link>
          </div>
        </div>

        {/* ── Piano keyboard visual ── */}
        <div className="relative mx-auto max-w-3xl px-6" aria-hidden>
          <div className="relative flex items-end justify-center">
            {/* White keys */}
            <div className="flex gap-[3px]">
              {pianoKeys.map((key, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative w-[clamp(28px,5vw,52px)] rounded-t-md border border-b-0 transition-all",
                    key.active
                      ? "h-[clamp(80px,14vw,140px)] border-[#d9ccb2] bg-gradient-to-b from-[#f8f4ea] to-[#e7decc] shadow-[0_0_20px_rgba(248,244,234,0.3)]"
                      : "h-[clamp(72px,12vw,120px)] border-[#3d3a34] bg-gradient-to-b from-[#4a4640] to-[#3d3a34]",
                  )}
                >
                  {key.active && key.label && (
                    <span
                      className={cn(
                        "absolute bottom-3 left-1/2 -translate-x-1/2 text-[clamp(8px,1.2vw,13px)] font-bold text-[#8e8068]",
                        optionBClassNames.body,
                      )}
                    >
                      {key.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Fade into page bg */}
          <div className="absolute inset-x-0 -bottom-1 h-8 bg-gradient-to-t from-[#f8f4ea] to-transparent" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="mb-16 text-center">
          <p
            className={cn(
              "mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8e8068]",
              optionBClassNames.body,
            )}
          >
            Fonctionnalites
          </p>
          <h2
            className={cn(
              "text-3xl font-bold md:text-5xl",
              optionBClassNames.display,
            )}
          >
            Tout ce qu&apos;il te faut pour progresser
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            }
            title="Importe tes grilles"
            description="Saisis tes accords manuellement ou importe-les depuis une image grace a l'OCR integre."
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 4v16" />
                <path d="M10 4v16" />
                <path d="M14 4v16" />
                <path d="M18 4v16" />
                <path d="M8 4v10" />
                <path d="M12 4v10" />
                <path d="M16 4v10" />
              </svg>
            }
            title="Visualise les voicings"
            description="Chaque accord est affiche sur un clavier de piano avec les doigtes suggeres et les inversions."
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h5l2-9 4 18 3-9h6" />
              </svg>
            }
            title="Transpose en un clic"
            description="Change la tonalite de n'importe quel morceau instantanement, tes voicings suivent."
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
              </svg>
            }
            title="Corrige et personnalise"
            description="Modifie les accords detectes, choisis ta notation preferee (dieses ou bemols)."
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            }
            title="Sauvegarde tes presets"
            description="Enregistre des configurations de pratique pour chaque morceau et retrouve-les facilement."
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            }
            title="Simple et gratuit"
            description="Pas d'abonnement, pas de publicite. Cree ton compte et commence a jouer."
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-y border-[#e7decc] bg-[#f3ede0]">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="mb-16 text-center">
            <p
              className={cn(
                "mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8e8068]",
                optionBClassNames.body,
              )}
            >
              Comment ca marche
            </p>
            <h2
              className={cn(
                "text-3xl font-bold md:text-5xl",
                optionBClassNames.display,
              )}
            >
              En trois etapes
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            <StepCard
              step="1"
              title="Ajoute un morceau"
              description="Colle ta grille d'accords en texte ou importe une photo. L'app detecte automatiquement chaque accord."
            />
            <StepCard
              step="2"
              title="Explore les voicings"
              description="Visualise chaque accord sur le clavier, compare les inversions et choisis tes voicings preferes."
            />
            <StepCard
              step="3"
              title="Joue et progresse"
              description="Transpose, sauvegarde tes presets et reviens pratiquer a tout moment. Tes selections sont memorisees."
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="relative overflow-hidden rounded-sm border border-[#d9ccb2] bg-white p-10 text-center shadow-sm md:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-[240px] rounded-full bg-[#f3ede0] blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-12 size-[200px] rounded-full bg-[#f3ede0] blur-2xl"
          />

          <div className="relative">
            <h2
              className={cn(
                "text-3xl font-bold md:text-5xl",
                optionBClassNames.display,
              )}
            >
              Pret a jouer ?
            </h2>
            <p
              className={cn(
                "mx-auto mt-4 max-w-md text-lg text-[#5a5246]",
                optionBClassNames.body,
              )}
            >
              Cree ton compte en quelques secondes et commence a apprendre tes
              morceaux preferes au piano.
            </p>
            <div className={cn("mt-8", optionBClassNames.body)}>
              <Link
                href="/signup"
                className="inline-flex h-12 items-center rounded-sm bg-[#2d2a24] px-8 text-base font-semibold text-[#f8f4ea] shadow-lg shadow-[#2d2a24]/10 transition-all hover:bg-[#2d2a24]/90 hover:shadow-xl hover:shadow-[#2d2a24]/15"
              >
                Commencer maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#2d2a24] text-[#c4b697]">
        <div className="mx-auto max-w-5xl px-6 py-10">
          {/* Top row: brand + nav */}
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <p
                className={cn(
                  "text-xl font-bold text-[#f8f4ea]",
                  optionBClassNames.display,
                )}
              >
                ChordLearner
              </p>
              <span className="hidden text-[#5a5246] sm:inline" aria-hidden>|</span>
              <p
                className={cn(
                  "hidden text-sm text-[#8e8068] sm:block",
                  optionBClassNames.body,
                )}
              >
                Apprends le piano par les accords
              </p>
            </div>

            <nav
              aria-label="Liens legaux"
              className={cn(
                "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm",
                optionBClassNames.body,
              )}
            >
              <Link
                href="/mentions-legales"
                className="text-[#a89a80] transition-colors hover:text-[#f8f4ea]"
              >
                Mentions legales
              </Link>
              <Link
                href="/cgu"
                className="text-[#a89a80] transition-colors hover:text-[#f8f4ea]"
              >
                CGU
              </Link>
              <Link
                href="/confidentialite"
                className="text-[#a89a80] transition-colors hover:text-[#f8f4ea]"
              >
                Confidentialite
              </Link>
            </nav>
          </div>

          {/* Bottom copyright */}
          <div
            className={cn(
              "mt-6 border-t border-[#3d3a34] pt-5 text-center text-xs text-[#6b6152]",
              optionBClassNames.body,
            )}
          >
            &copy; {new Date().getFullYear()} ChordLearner. Tous droits reserves.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-sm border border-[#e7decc] bg-white/60 p-6 transition-all hover:border-[#d9ccb2] hover:bg-white hover:shadow-sm">
      <div className="mb-4 inline-flex size-12 items-center justify-center rounded-sm bg-[#f3ede0] text-[#5a5246] transition-colors group-hover:bg-[#efe6d6] group-hover:text-[#2d2a24]">
        {icon}
      </div>
      <h3
        className={cn(
          "mb-2 text-lg font-bold",
          optionBClassNames.display,
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm leading-relaxed text-[#5a5246]",
          optionBClassNames.body,
        )}
      >
        {description}
      </p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "mx-auto mb-5 flex size-14 items-center justify-center rounded-full border-2 border-[#2d2a24] text-2xl font-bold text-[#2d2a24]",
          optionBClassNames.display,
        )}
      >
        {step}
      </div>
      <h3
        className={cn(
          "mb-2 text-xl font-bold",
          optionBClassNames.display,
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm leading-relaxed text-[#5a5246]",
          optionBClassNames.body,
        )}
      >
        {description}
      </p>
    </div>
  );
}
