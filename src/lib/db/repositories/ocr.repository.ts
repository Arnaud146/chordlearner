import { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  OCRImportInsert,
  OCRImportRow,
  OCRImportUpdate,
} from "@/lib/types/db";
import { assertSupabaseData } from "@/lib/db/helpers";

export function createOCRRepository(supabase: SupabaseClient<Database>) {
  return {
    async createOCRImport(input: OCRImportInsert): Promise<OCRImportRow> {
      const res = await supabase
        .from("ocr_imports")
        .insert(input)
        .select()
        .single();
      return assertSupabaseData(res);
    },

    async getOCRImportById(id: string): Promise<OCRImportRow> {
      const res = await supabase
        .from("ocr_imports")
        .select("*")
        .eq("id", id)
        .single();
      return assertSupabaseData(res);
    },

    async updateOCRImport(
      id: string,
      patch: OCRImportUpdate,
    ): Promise<OCRImportRow> {
      const res = await supabase
        .from("ocr_imports")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      return assertSupabaseData(res);
    },

    async listOCRImportsBySong(songId: string): Promise<OCRImportRow[]> {
      const res = await supabase
        .from("ocr_imports")
        .select("*")
        .eq("song_id", songId)
        .order("created_at", { ascending: false });
      return assertSupabaseData(res);
    },
  };
}
