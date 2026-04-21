import { Disc3, Play, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
            className={`grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 p-3 transition duration-200 md:grid-cols-[4rem_1fr_auto] md:gap-5 md:p-4 ${
              isActive ? "border-primary bg-primary/12 shadow-primary/10" : "hover:border-primary/35 hover:bg-white/[0.035]"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted font-bold text-muted-foreground md:h-14 md:w-14">
              {isActive ? (
                <Disc3 className="h-5 w-5 animate-spin text-primary [animation-duration:3s]" />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-black">{track.title}</h3>
                {isActive ? <Badge className="h-6 tracking-[0.1em]">Playing</Badge> : null}
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {track.artist}
                {track.album ? ` - ${track.album}` : ""}
              </p>
              <p className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{track.genre || "Unknown"}</span>
                <span>/</span>
                <span>{track.releaseYear || "N/A"}</span>
                <span>/</span>
                <span>{formatDuration(track.durationSeconds)}</span>
              </p>
            </div>
            <Button size="icon" variant={isActive ? "accent" : "default"} aria-label={`Play ${track.title}`} onClick={() => onPlay(track)}>
              <Play className="h-4 w-4 fill-current" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
