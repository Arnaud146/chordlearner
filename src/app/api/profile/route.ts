import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { updateProfileSchema } from "@/lib/api/schemas/profile.schemas";
import { apiError, handleApiError } from "@/lib/api/responses";
import { DatabaseError } from "@/lib/db/helpers";
import { createProfileRepository } from "@/lib/db/repositories/profile.repository";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/types/db";

function toProfileDto(profile: ProfileRow) {
  return {
    displayName: profile.display_name,
    fullName: profile.full_name,
  };
}

function normalizeFullName(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.length > 0 ? value : null;
}

function isProfilesTableMissing(error: unknown): boolean {
  return (
    error instanceof DatabaseError &&
    (error.code === "42P01" || /relation "profiles" does not exist/i.test(error.message))
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await requireAuth(supabase);
    const profileRepository = createProfileRepository(supabase);

    const [profile, stats] = await Promise.all([
      profileRepository.getOrCreateProfile({
        userId: user.id,
        email: user.email ?? null,
      }),
      profileRepository.getProfileStats(),
    ]);

    return NextResponse.json({
      data: {
        account: {
          email: user.email ?? null,
          createdAt: user.created_at ?? new Date().toISOString(),
        },
        profile: toProfileDto(profile),
        stats,
      },
    });
  } catch (error) {
    if (isProfilesTableMissing(error)) {
      return apiError("La table profiles est introuvable. Lance la migration 005_profiles.sql.", 500);
    }
    return handleApiError(error, "Impossible de charger le profil");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = updateProfileSchema.parse(await request.json());

    const supabase = await createClient();
    const user = await requireAuth(supabase);
    const profileRepository = createProfileRepository(supabase);

    await profileRepository.getOrCreateProfile({
      userId: user.id,
      email: user.email ?? null,
    });

    const fullName = normalizeFullName(payload.fullName);
    const updatedProfile = await profileRepository.updateProfile(user.id, {
      display_name: payload.displayName,
      ...(fullName !== undefined ? { full_name: fullName } : {}),
    });

    return NextResponse.json({
      data: toProfileDto(updatedProfile),
    });
  } catch (error) {
    if (isProfilesTableMissing(error)) {
      return apiError("La table profiles est introuvable. Lance la migration 005_profiles.sql.", 500);
    }
    return handleApiError(error, "Impossible de mettre a jour le profil");
  }
}
