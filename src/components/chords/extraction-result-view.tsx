"use client";

import { ChordBadges } from "@/components/chords/chord-badges";
import { StructuredSongPreview } from "@/components/chords/structured-song-preview";
import { optionBClassNames } from "@/components/option-b/theme";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChordExtractionResult } from "@/types/chords";

interface ExtractionResultViewProps {
  result: ChordExtractionResult;
}

export function ExtractionResultView({ result }: ExtractionResultViewProps) {
  return (
    <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
      <CardHeader className="space-y-2">
        <CardTitle className={`${optionBClassNames.display} text-3xl font-bold text-[var(--song-text)]`}>
          Extraction result
        </CardTitle>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant={result.success ? "secondary" : "destructive"}>
            {result.success ? "success" : "failure"}
          </Badge>
          <Badge variant="outline">mode: {result.mode}</Badge>
          <Badge variant="outline">
            fallback: {result.fallbackUsed ? "yes" : "no"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.song ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--song-border-soft)] bg-[var(--song-surface-soft)] p-3 text-sm">
                <p className="font-medium">Detected sections</p>
                <p className="text-[var(--song-text-muted)]">{result.song.stats.sections}</p>
              </div>
              <div className="rounded-xl border border-[var(--song-border-soft)] bg-[var(--song-surface-soft)] p-3 text-sm">
                <p className="font-medium">Chord lines</p>
                <p className="text-[var(--song-text-muted)]">{result.song.stats.chordLines}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Unique chords</p>
              <ChordBadges chords={result.song.allChords} />
            </div>
          </>
        ) : null}

        <Tabs defaultValue="preview">
          <TabsList className="h-auto rounded-xl border border-[var(--song-border)] bg-[var(--song-surface-muted)] p-1">
            <TabsTrigger
              value="preview"
              className={`${optionBClassNames.body} rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-[var(--song-text-muted)] data-[state=active]:border-[var(--song-border)] data-[state=active]:bg-[var(--song-surface)] data-[state=active]:text-[var(--song-text)]`}
            >
              Structured preview
            </TabsTrigger>
            <TabsTrigger
              value="debug"
              className={`${optionBClassNames.body} rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-[var(--song-text-muted)] data-[state=active]:border-[var(--song-border)] data-[state=active]:bg-[var(--song-surface)] data-[state=active]:text-[var(--song-text)]`}
            >
              Raw JSON
            </TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            {result.song ? (
              <StructuredSongPreview song={result.song} />
            ) : (
              <p className="text-sm text-[var(--song-text-muted)]">No structured result.</p>
            )}
          </TabsContent>
          <TabsContent value="debug">
            <ScrollArea className="h-80 rounded-xl border border-[var(--song-border)] bg-[var(--song-surface-soft)]">
              <pre className="p-3 text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(
                  {
                    ...result,
                    song: result.song,
                    debug: result.debug,
                  },
                  null,
                  2,
                )}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
