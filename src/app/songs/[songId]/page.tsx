import { notFound } from "next/navigation";
import { SongDetailContent } from "@/components/song-detail-content";
import { createSongRepository } from "@/lib/db/repositories/song.repository";
import { createClient } from "@/lib/supabase/server";

interface SongDetailPageProps {
  params: Promise<{ songId: string }>;
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const { songId } = await params;
  const supabase = await createClient();
  const songRepository = createSongRepository(supabase);
  let song;

  try {
    song = await songRepository.getSongById(songId);
  } catch {
    notFound();
  }

  return <SongDetailContent song={song} />;
}
