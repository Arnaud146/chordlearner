import { OCRReviewWorkspace } from "@/components/ocr-review-workspace";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";

interface OCRReviewNewPageProps {
  searchParams: Promise<{ ocrImportId?: string; imageUrl?: string }>;
}

export default async function OCRReviewNewPage({
  searchParams,
}: OCRReviewNewPageProps) {
  const { ocrImportId, imageUrl } = await searchParams;

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
          Uses web extraction first, then OCR as a fallback. Review and validate before
          creating.
        </p>
      </div>
      <OCRReviewWorkspace
        initialImageUrl={imageUrl}
        initialOCRImportId={ocrImportId}
      />
    </div>
  );
}
