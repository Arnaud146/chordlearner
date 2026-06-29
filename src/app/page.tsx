import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  optionBBodyFont,
  optionBClassNames,
  optionBDisplayFont,
} from "@/components/option-b/theme";
import { PublicFooter } from "@/components/public-footer";
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
      <section className="relative overflow-hidden bg-[var(--song-hero-dark)] pb-0 pt-16 md:pt-20">
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
            The piano app to master your chords
          </p>

          <h1
            className={cn(
              "mx-auto max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-[#f8f4ea] md:text-8xl",
              optionBClassNames.display,
            )}
          >
            Play your songs
            <br />
            <span className="bg-gradient-to-r from-[#d9ccb2] to-[#8e8068] bg-clip-text text-transparent">
              on the piano
            </span>
          </h1>

          <p
            className={cn(
              "mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#a89a80] md:text-xl",
              optionBClassNames.body,
            )}
          >
            Import a chord chart, discover voicings on the keyboard and
            transpose in one click. Free.
          </p>

          <div
            className={cn(
              "mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row",
              optionBClassNames.body,
            )}
          >
            <Link
              href="/signup"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-[#f8f4ea] px-10 text-base font-bold text-[var(--song-hero-dark)] shadow-[var(--song-shadow)] transition-all hover:bg-white hover:shadow-[var(--song-shadow-hover)]"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#5a5246] px-10 text-base font-semibold text-[#c4b697] transition-all hover:border-[#8e8068] hover:text-[#f8f4ea] hover:bg-white/5"
            >
              I already have an account
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
            Features
          </p>
          <h2
            className={cn(
              "text-3xl font-bold md:text-5xl",
              optionBClassNames.display,
            )}
          >
            Everything you need to make progress
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
            title="Import your charts"
            description="Enter your chords manually or import them from an image thanks to the built-in OCR."
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
            title="Visualize the voicings"
            description="Each chord is shown on a piano keyboard with suggested fingerings and inversions."
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h5l2-9 4 18 3-9h6" />
              </svg>
            }
            title="Transpose in one click"
            description="Change the key of any song instantly, and your voicings follow along."
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
              </svg>
            }
            title="Correct and customize"
            description="Edit the detected chords and choose your preferred notation (sharps or flats)."
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            }
            title="Save your presets"
            description="Save practice configurations for each song and find them again easily."
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            }
            title="Simple and free"
            description="No subscription, no ads. Create your account and start playing."
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
              How it works
            </p>
            <h2
              className={cn(
                "text-3xl font-bold md:text-5xl",
                optionBClassNames.display,
              )}
            >
              In three steps
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            <StepCard
              step="1"
              title="Add a song"
              description="Paste your chord chart as text or import a photo. The app automatically detects each chord."
            />
            <StepCard
              step="2"
              title="Explore the voicings"
              description="Visualize each chord on the keyboard, compare inversions and choose your favorite voicings."
            />
            <StepCard
              step="3"
              title="Play and progress"
              description="Transpose, save your presets and come back to practice anytime. Your selections are remembered."
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="relative overflow-hidden rounded-xl border border-[var(--song-border)] bg-white p-10 text-center shadow-[var(--song-shadow)] md:p-16">
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
              Ready to play?
            </h2>
            <p
              className={cn(
                "mx-auto mt-4 max-w-md text-lg text-[var(--song-text-muted)]",
                optionBClassNames.body,
              )}
            >
              Create your account in seconds and start learning your favorite
              songs on the piano.
            </p>
            <div className={cn("mt-8", optionBClassNames.body)}>
              <Link
                href="/signup"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-[var(--song-accent)] px-8 text-base font-semibold text-[var(--song-accent-foreground)] shadow-[var(--song-shadow)] transition-all hover:bg-[var(--song-accent-hover)] hover:shadow-[var(--song-shadow-hover)]"
              >
                Start now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
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
    <div className="group rounded-xl border border-[var(--song-border-soft)] bg-white/80 p-6 shadow-[var(--song-shadow)] transition-all hover:border-[var(--song-border)] hover:bg-white hover:shadow-[var(--song-shadow-hover)]">
      <div className="mb-4 inline-flex size-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-[var(--song-surface-muted)] text-[var(--song-text-muted)] transition-colors group-hover:bg-[var(--song-surface-highlight)] group-hover:text-[var(--song-accent)]">
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
          "text-sm leading-relaxed text-[var(--song-text-muted)]",
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
          "mx-auto mb-5 flex size-14 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 border-[var(--song-accent)] bg-[var(--song-accent)]/10 text-2xl font-bold text-[var(--song-accent)]",
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
          "text-sm leading-relaxed text-[var(--song-text-muted)]",
          optionBClassNames.body,
        )}
      >
        {description}
      </p>
    </div>
  );
}
