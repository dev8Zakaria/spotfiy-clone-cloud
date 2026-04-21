import { useEffect, useRef, useState } from "react";
import { Loader2, Music2, Pause, Play, Radio, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

export function PlayerBar({ track, audioUrl, loading }) {
  const audioRef = useRef(null);
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progress = duration ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setPaused(!audioUrl);
  }, [audioUrl]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  function handleSeek(event) {
    const nextTime = Number(event.target.value);
    setCurrentTime(nextTime);
    if (audioRef.current) audioRef.current.currentTime = nextTime;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/92 px-3 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl md:px-4">
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        autoPlay={Boolean(audioUrl)}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onEnded={() => setPaused(true)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
      />

      <div className="mx-auto grid max-w-7xl gap-3 rounded-lg border border-border bg-card/90 p-3 shadow-2xl shadow-black/25 md:grid-cols-[minmax(0,1fr)_minmax(18rem,1.7fr)_auto] md:items-center md:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Card className="flex h-12 w-12 shrink-0 items-center justify-center bg-muted">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Music2 className="h-5 w-5 text-primary" />}
          </Card>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-black">{track?.title || "Choose a track"}</p>
              {track ? (
                <Badge variant="accent" className="hidden h-6 shrink-0 sm:inline-flex">
                  <Radio className="mr-1.5 h-3 w-3" />
                  Live
                </Badge>
              ) : null}
            </div>
            <p className="truncate text-sm text-muted-foreground">{track?.artist || "Ready to stream from MinIO"}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant={audioUrl ? "default" : "secondary"}
              disabled={!audioUrl || loading}
              aria-label={paused ? "Play current track" : "Pause current track"}
              onClick={togglePlayback}
              className="h-11 w-11 shrink-0 rounded-lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : paused ? (
                <Play className="h-4 w-4 fill-current" />
              ) : (
                <Pause className="h-4 w-4 fill-current" />
              )}
            </Button>
            <span className="w-12 text-right text-sm font-semibold text-muted-foreground">{formatDuration(Math.floor(currentTime))}</span>
            <input
              className="player-range"
              type="range"
              min="0"
              max={duration || 0}
              step="1"
              value={Math.min(currentTime, duration || 0)}
              disabled={!audioUrl}
              onChange={handleSeek}
              style={{ "--progress": `${progress}%` }}
              aria-label="Track progress"
            />
            <span className="w-12 text-sm font-semibold text-muted-foreground">{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-md border border-border bg-background/45 px-3 py-2 text-sm font-semibold text-muted-foreground lg:flex">
          <Volume2 className="h-4 w-4 text-primary" />
          MinIO stream
        </div>
      </div>
    </div>
  );
}
