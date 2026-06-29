import { redirect } from "next/navigation";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";
import { ProfileForm } from "@/components/profile/profile-form";
import { SecurityActions } from "@/components/profile/security-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProfileRepository, type ProfileStats } from "@/lib/db/repositories/profile.repository";
import { createClient } from "@/lib/supabase/server";

function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue) return "Unknown date";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function StatsCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--song-border)] bg-[var(--song-surface-soft)] p-4">
      <p className={`${optionBClassNames.body} text-xs uppercase tracking-[0.12em] text-[var(--song-text-subtle)]`}>
        {label}
      </p>
      <p className={`${optionBClassNames.display} mt-2 text-4xl leading-none font-bold text-[var(--song-text)]`}>
        {value}
      </p>
    </div>
  );
}

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profil");
  }

  const profileRepository = createProfileRepository(supabase);
  let profile: { display_name: string; full_name: string | null } | null = null;
  let stats: ProfileStats | null = null;
  let loadError: string | null = null;

  try {
    [profile, stats] = await Promise.all([
      profileRepository.getOrCreateProfile({
        userId: user.id,
        email: user.email ?? null,
      }),
      profileRepository.getProfileStats(),
    ]);
  } catch (error) {
    if (
      error instanceof Error &&
      /relation "profiles" does not exist/i.test(error.message)
    ) {
      loadError = "The profile is not available. Run the 005_profiles.sql migration.";
    } else {
      loadError =
        error instanceof Error ? error.message : "Unable to load the profile data.";
    }
  }

  const memberSinceLabel = formatDate(user.created_at);

  return (
    <div
      className={`${optionBDisplayFont.variable} ${optionBBodyFont.variable} song-shell space-y-8 bg-[var(--song-bg)] text-[var(--song-text)]`}
    >
      <section className="space-y-3">
        <p
          className={`${optionBClassNames.body} text-xs font-semibold uppercase tracking-[0.14em] text-[var(--song-text-subtle)]`}
        >
          Account
        </p>
        <h1 className={`${optionBClassNames.display} text-5xl leading-[0.95] font-bold md:text-7xl`}>
          My profile
        </h1>
        <p className={`${optionBClassNames.body} max-w-3xl text-lg text-[var(--song-text-muted)] md:text-xl`}>
          Update your identity and check the statistics for your ChordLearner space.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
          <CardHeader>
            <CardTitle className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
              Account information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--song-border)] bg-[var(--song-surface-soft)] p-4">
                <p className={`${optionBClassNames.body} text-xs uppercase tracking-[0.1em] text-[var(--song-text-subtle)]`}>
                  Email
                </p>
                <p className={`${optionBClassNames.body} mt-2 text-sm font-semibold text-[var(--song-text)]`}>
                  {user.email ?? "Email unavailable"}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--song-border)] bg-[var(--song-surface-soft)] p-4">
                <p className={`${optionBClassNames.body} text-xs uppercase tracking-[0.1em] text-[var(--song-text-subtle)]`}>
                  Member since
                </p>
                <p className={`${optionBClassNames.body} mt-2 text-sm font-semibold text-[var(--song-text)]`}>
                  {memberSinceLabel}
                </p>
              </div>
            </div>

            {loadError ? (
              <p className={`${optionBClassNames.body} text-sm font-medium text-[var(--song-danger)]`}>
                {loadError}
              </p>
            ) : profile ? (
              <ProfileForm
                initialDisplayName={profile.display_name}
                initialFullName={profile.full_name}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
          <CardHeader>
            <CardTitle className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {stats ? (
              <>
                <StatsCard label="Songs" value={stats.songsCount} />
                <StatsCard label="Presets" value={stats.presetsCount} />
                <StatsCard label="OCR imports" value={stats.ocrImportsCount} />
                <StatsCard label="Extractions" value={stats.extractionsCount} />
              </>
            ) : (
              <p className={`${optionBClassNames.body} text-sm text-[var(--song-text-muted)]`}>
                Statistics are not available at the moment.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
          <CardHeader>
            <CardTitle className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SecurityActions userEmail={user.email ?? null} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
