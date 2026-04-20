import { Loader2, Music2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function PlayerBar({ track, audioUrl, loading }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/92 px-4 py-3 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-[1fr_2fr] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <Card className="flex h-12 w-12 shrink-0 items-center justify-center bg-muted">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Music2 className="h-5 w-5" />}
          </Card>
          <div className="min-w-0">
            <p className="truncate font-medium">{track?.title || "Choose a track"}</p>
            <p className="truncate text-sm text-muted-foreground">{track?.artist || "Ready to stream from MinIO"}</p>
          </div>
        </div>
        <audio className="w-full" src={audioUrl || undefined} controls autoPlay={Boolean(audioUrl)} />
      </div>
    </div>
  );
}
