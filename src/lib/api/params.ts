import { z } from "zod";

const songIdParamSchema = z.object({
  songId: z.string().uuid("Invalid songId"),
});

const presetIdParamSchema = z.object({
  songId: z.string().uuid("Invalid songId"),
  presetId: z.string().uuid("Invalid presetId"),
});

export async function parseSongIdParam(
  paramsPromise: Promise<{ songId: string }>,
): Promise<string> {
  const params = await paramsPromise;
  return songIdParamSchema.parse(params).songId;
}

export async function parseSongAndPresetIdParams(
  paramsPromise: Promise<{ songId: string; presetId: string }>,
): Promise<{ songId: string; presetId: string }> {
  const params = await paramsPromise;
  return presetIdParamSchema.parse(params);
}
