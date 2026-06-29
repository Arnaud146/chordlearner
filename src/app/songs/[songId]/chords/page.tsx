import { notFound } from "next/navigation";
import { SongDetailContent } from "@/components/song-detail-content";
import { createChordRepository } from "@/lib/db/repositories/chord.repository";
import { createSongRepository } from "@/lib/db/repositories/song.repository";
import { createClient } from "@/lib/supabase/server";

interface ChordsPageProps {
  params: Promise<{ songId: string }>;
}

export default async function ChordsPage({ params }: ChordsPageProps) {
  const { songId } = await params;
  const supabase = await createClient();
  const songRepository = createSongRepository(supabase);
  const chordRepository = createChordRepository(supabase);

  let song;
  try {
    song = await songRepository.getSongById(songId);
  } catch {
    notFound();
  }

  const [occurrences, uniqueChords] = await Promise.all([
    chordRepository.getChordOccurrencesBySong(songId),
    chordRepository.getUniqueChordsBySong(songId),
  ]);

  const orderedUniqueChords = [...uniqueChords].sort(
    (a, b) => b.occurrence_count - a.occurrence_count,
  );

  return (
    <SongDetailContent
      song={song}
      initialOccurrences={occurrences}
      initialUniqueChords={orderedUniqueChords}
    />
  );
}
