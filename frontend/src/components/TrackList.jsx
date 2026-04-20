import { Play, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

export function TrackList({ tracks, currentTrack, onPlay }) {
  if (!tracks.length) {
    return (
      <Card className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
        <Radio className="h-10 w-10" />
        <p>No tracks found.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {tracks.map((track, index) => {
        const isActive = currentTrack?.id === track.id;

        return (
          <Card
            key={track.id}
            className={`grid grid-cols-[3rem_1fr_auto] items-center gap-4 p-4 transition ${
              isActive ? "border-primary bg-primary/10" : "hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted font-semibold text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{track.title}</h3>
              <p className="truncate text-sm text-muted-foreground">
                {track.artist}
                {track.album ? ` • ${track.album}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {track.genre || "Unknown"} • {track.releaseYear || "N/A"} • {formatDuration(track.durationSeconds)}
              </p>
            </div>
            <Button size="icon" aria-label={`Play ${track.title}`} onClick={() => onPlay(track)}>
              <Play className="h-4 w-4 fill-current" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
