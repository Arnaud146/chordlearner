import { ImportCard } from "@/components/import-card";
import { ManualInputForm } from "@/components/manual-input-form";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";

export default function NewSongPage() {
  return (
    <div
      className={`${optionBDisplayFont.variable} ${optionBBodyFont.variable} song-shell space-y-8 bg-[var(--song-bg)] text-[var(--song-text)]`}
    >
      <section className="space-y-4">
        <p
          className={`${optionBClassNames.body} text-xs font-semibold uppercase tracking-[0.14em] text-[var(--song-text-subtle)]`}
        >
          New song
        </p>
        <h1 className={`${optionBClassNames.display} text-5xl leading-[0.95] font-bold md:text-7xl`}>
          Add a song
          <br />
          to your practice.
        </h1>
        <p className={`${optionBClassNames.body} max-w-3xl text-lg text-[var(--song-text-muted)] md:text-xl`}>
          Clearly choose your import method: a web URL for automatic extraction, or
          an image/PDF file for OCR.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <ImportCard />

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-[var(--song-border)]" />
            <span className={`${optionBClassNames.body} text-sm text-[var(--song-text-subtle)]`}>
              or enter the chart manually
            </span>
            <div className="h-px flex-1 bg-[var(--song-border)]" />
          </div>

          <ManualInputForm />
        </div>

        <aside className="h-fit rounded-2xl border border-[var(--song-border)] bg-[var(--song-surface-muted)] p-5 shadow-[var(--song-shadow)]">
          <h2 className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
            Tips
          </h2>
          <ul className={`${optionBClassNames.body} mt-3 space-y-2 text-sm text-[var(--song-text-muted)]`}>
            <li>Keep clear line breaks between chord groups.</li>
            <li>Add the original key as soon as you know it.</li>
            <li>Review the OCR result before final confirmation.</li>
          </ul>
        </aside>
      </section>
    </div>
  );
}
