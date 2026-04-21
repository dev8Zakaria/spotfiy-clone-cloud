import { useEffect, useMemo, useState } from "react";
import { Cloud, Database, HardDrive, RotateCcw, Search, SignalHigh, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { PlayerBar } from "@/components/PlayerBar";
import { TrackList } from "@/components/TrackList";
import { getGenres, getPlaybackUrl, getTracks } from "@/lib/api";

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  const stats = useMemo(
    () => [
      { label: "Indexed", value: tracks.length, icon: Database, tone: "text-primary" },
      { label: "Storage", value: "MinIO", icon: HardDrive, tone: "text-accent" },
      { label: "Access", value: "Tunnel", icon: Cloud, tone: "text-foreground" }
    ],
    [tracks.length]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [{ tracks: nextTracks }, { genres: nextGenres }] = await Promise.all([
          getTracks({ q: query, genre }),
          getGenres()
        ]);
        if (!cancelled) {
          setTracks(nextTracks);
          setGenres(nextGenres);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(load, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, genre]);

  async function handlePlay(track) {
    setPlaying(true);
    setError("");
    try {
      const { url } = await getPlaybackUrl(track.id);
      setCurrentTrack(track);
      setAudioUrl(url);
    } catch (playError) {
      setError(playError.message);
    } finally {
      setPlaying(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="page-content mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <header className="overflow-hidden rounded-lg border border-border bg-card/55 p-4 shadow-2xl shadow-black/25 backdrop-blur md:p-6">
          <div className="relative flex min-h-[25rem] flex-col justify-between overflow-hidden rounded-md border border-border/80 bg-background/35 p-5 md:p-8">
            <div className="absolute -right-16 top-8 hidden h-64 w-64 rounded-full border border-primary/25 lg:block" />
            <div className="absolute -right-6 top-28 hidden h-40 w-40 rounded-full border border-accent/20 lg:block" />
            <div className="flex flex-wrap items-center gap-2">
              <Badge>
                <SignalHigh className="mr-2 h-3.5 w-3.5" />
                Live cloud catalogue
              </Badge>
              <Badge variant="accent">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                ENSA Stream
              </Badge>
            </div>
            <div>
              <h1 className="display-title max-w-5xl text-5xl font-black leading-[0.9] text-foreground md:text-7xl lg:text-8xl">
                Cloud music, tuned for class demos.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                Browse the PostgreSQL catalogue, stream signed MinIO audio, and watch the deployment stack feel like one polished product.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-md border border-border bg-card/70 p-4">
                  <item.icon className={`mb-4 h-5 w-5 ${item.tone}`} />
                  <p className="text-2xl font-black">{item.value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <Card className="grid gap-3 p-3 md:grid-cols-[1fr_13rem_auto] md:p-4">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search title, artist, album, or genre"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Select value={genre} onChange={(event) => setGenre(event.target.value)}>
            <option value="all">All genres</option>
            {genres.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={() => { setQuery(""); setGenre("all"); }}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </Card>

        {error ? (
          <Card className="border-destructive/40 bg-destructive/10 p-4 text-destructive-foreground">{error}</Card>
        ) : null}

        {loading ? (
          <Card className="p-10 text-center text-muted-foreground">Loading catalogue...</Card>
        ) : (
          <TrackList tracks={tracks} currentTrack={currentTrack} onPlay={handlePlay} />
        )}
      </section>

      <PlayerBar track={currentTrack} audioUrl={audioUrl} loading={playing} />
    </main>
  );
}
