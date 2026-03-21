import { Separator } from "@/components/ui/separator";
import type { StructuredSong } from "@/types/chords";

interface StructuredSongPreviewProps {
  song: StructuredSong;
}

export function StructuredSongPreview({ song }: StructuredSongPreviewProps) {
  return (
    <div className="space-y-4">
      {song.sections.map((section, sectionIndex) => (
        <div key={`${section.label}-${sectionIndex}`} className="space-y-2">
          <h4 className="text-sm font-semibold">{section.label}</h4>
          <div className="space-y-1 text-sm">
            {section.lines.map((line, lineIndex) => (
              <p
                key={`${section.label}-${lineIndex}`}
                className={line.kind === "chords_only" ? "font-mono" : ""}
              >
                {line.kind === "lyrics_with_chords" ? (
                  <>
                    <span className="font-mono">{line.rawChords ?? line.chords.join(" ")}</span>
                    <br />
                    <span>{line.rawLyrics ?? line.lyrics ?? line.raw}</span>
                  </>
                ) : (
                  line.raw
                )}
              </p>
            ))}
          </div>
          {sectionIndex < song.sections.length - 1 ? <Separator /> : null}
        </div>
      ))}
    </div>
  );
}
