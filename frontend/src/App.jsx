import { useEffect, useMemo, useState } from "react";
import { Cloud, Database, HardDrive, Search } from "lucide-react";
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
      { label: "Tracks", value: tracks.length, icon: Database },
      { label: "Storage", value: "MinIO", icon: HardDrive },
      { label: "Access", value: "Tunnel", icon: Cloud }
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
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
        <header className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">ENSA cloud platform</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">ENSA Stream</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              A Spotify-inspired cloud deployment powered by React, Express, PostgreSQL, MinIO, Nginx, Tailscale, and Cloudflare Tunnel.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((item) => (
              <Card key={item.label} className="p-4">
                <item.icon className="mb-3 h-5 w-5 text-primary" />
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </Card>
            ))}
          </div>
        </header>

        <Card className="grid gap-3 p-4 md:grid-cols-[1fr_13rem_auto]">
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
          <Button variant="secondary" onClick={() => { setQuery(""); setGenre("all"); }}>
            Reset
          </Button>
        </Card>

        {error ? (
          <Card className="border-red-500/40 bg-red-500/10 p-4 text-red-100">{error}</Card>
        ) : null}

        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading catalogue...</Card>
        ) : (
          <TrackList tracks={tracks} currentTrack={currentTrack} onPlay={handlePlay} />
        )}
      </section>

      <PlayerBar track={currentTrack} audioUrl={audioUrl} loading={playing} />
    </main>
  );
}
