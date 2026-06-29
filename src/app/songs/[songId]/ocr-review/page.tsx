import { OCRReviewWorkspace } from "@/components/ocr-review-workspace";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";
import { createOCRRepository } from "@/lib/db/repositories/ocr.repository";
import { createClient } from "@/lib/supabase/server";

interface OcrReviewPageProps {
  params: Promise<{ songId: string }>;
}

export default async function OcrReviewPage({ params }: OcrReviewPageProps) {
  const { songId } = await params;
  const supabase = await createClient();
  const ocrRepository = createOCRRepository(supabase);
  const imports = await ocrRepository.listOCRImportsBySong(songId);
  const latestImport = imports[0];

  return (
    <div
      className={`${optionBDisplayFont.variable} ${optionBBodyFont.variable} song-shell mx-auto max-w-6xl space-y-6 bg-[var(--song-bg)] text-[var(--song-text)]`}
    >
      <div className="space-y-2">
        <p
          className={`${optionBClassNames.body} text-xs font-semibold uppercase tracking-[0.14em] text-[var(--song-text-subtle)]`}
        >
          OCR review
        </p>
        <h1
          className={`${optionBClassNames.display} text-5xl leading-[0.95] font-bold text-[var(--song-text)] md:text-6xl`}
        >
          Smart import: chords/lyrics
        </h1>
        <p className={`${optionBClassNames.body} text-base text-[var(--song-text-muted)] md:text-lg`}>
          Song: {songId}
        </p>
      </div>
      <OCRReviewWorkspace
        sourceSongId={songId}
        initialImageUrl={latestImport?.image_url}
        initialOCRImportId={latestImport?.id}
      />
    </div>
  );
}
