import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChordBadgesProps {
  chords: string[];
}

export function ChordBadges({ chords }: ChordBadgesProps) {
  if (chords.length === 0) {
    return <p className="text-sm text-muted-foreground">No chord detected.</p>;
  }

  return (
    <ScrollArea className="max-h-28 rounded-md border p-2">
      <div className="flex flex-wrap gap-2">
        {chords.map((chord) => (
          <Badge key={chord} variant="secondary">
            {chord}
          </Badge>
        ))}
      </div>
    </ScrollArea>
  );
}
