import { useEffect, useMemo, useRef, useState } from "react";
import { Cloud, FileAudio, Database, HardDrive, RotateCcw, Search, SignalHigh, Sparkles, UploadCloud, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { PlayerBar } from "@/components/PlayerBar";
import { TrackList } from "@/components/TrackList";
import { getGenres, getPlaybackUrl, getTracks, uploadTrack } from "@/lib/api";

const emptyUploadForm = {
  title: "",
  artist: "",
  album: "",
  genre: "",
  releaseYear: "",
  durationSeconds: ""
};

const defaultGenres = [
  "Pop",
  "Rock",
  "Hip-Hop",
  "Rap",
  "R&B",
  "Electronic",
  "Dance",
  "House",
  "Techno",
  "Jazz",
  "Blues",
  "Soul",
  "Funk",
  "Classical",
  "Ambient",
  "Lo-fi",
  "Indie",
  "Alternative",
  "Metal",
  "Punk",
  "Reggae",
  "Afrobeats",
  "Latin",
  "Country",
  "Folk",
  "Soundtrack",
  "World",
  "Other"
];

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [uploadFile, setUploadFile] = useState(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef(null);

  const stats = useMemo(
    () => [
      { label: "Indexed", value: tracks.length, icon: Database, tone: "text-primary" },
      { label: "Storage", value: "MinIO", icon: HardDrive, tone: "text-accent" },
      { label: "Access", value: "Tunnel", icon: Cloud, tone: "text-foreground" }
    ],
    [tracks.length]
  );

  const uploadGenres = useMemo(() => {
    return Array.from(new Set([...defaultGenres, ...genres])).sort((first, second) => first.localeCompare(second));
  }, [genres]);

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
  }, [query, genre, refreshKey]);

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

  function updateUploadField(field, value) {
    setUploadForm((current) => ({ ...current, [field]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    chooseUploadFile(file);
  }

  function chooseUploadFile(file) {
    setUploadFile(file);

    if (file && !uploadForm.title) {
      updateUploadField("title", file.name.replace(/\.[^.]+$/, ""));
    }

    if (!file) {
      updateUploadField("durationSeconds", "");
      return;
    }

    const previewAudio = document.createElement("audio");
    const previewUrl = URL.createObjectURL(file);
    previewAudio.preload = "metadata";
    previewAudio.src = previewUrl;
    previewAudio.onloadedmetadata = () => {
      URL.revokeObjectURL(previewUrl);
      if (Number.isFinite(previewAudio.duration)) {
        updateUploadField("durationSeconds", String(Math.round(previewAudio.duration)));
      }
    };
    previewAudio.onerror = () => URL.revokeObjectURL(previewUrl);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setDragActive(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    chooseUploadFile(event.dataTransfer.files?.[0] || null);
  }

  function closeUpload() {
    if (uploading) return;
    setUploadOpen(false);
    setDragActive(false);
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!uploadFile) {
      setError("Choose an audio file first.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      await uploadTrack({ file: uploadFile, ...uploadForm });
      setUploadFile(null);
      setUploadForm(emptyUploadForm);
      event.currentTarget.reset();
      setRefreshKey((key) => key + 1);
      setUploadOpen(false);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
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

        <Card className="grid gap-3 p-3 md:grid-cols-[1fr_13rem_auto_auto] md:p-4">
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
          <Button variant="accent" onClick={() => setUploadOpen(true)}>
            <UploadCloud className="h-4 w-4" />
            Upload
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

      {uploadOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true">
          <form
            className="upload-modal w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-black/50"
            onSubmit={handleUpload}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border bg-background/35 p-5 md:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Catalogue upload</p>
                <h2 className="mt-2 text-2xl font-black md:text-3xl">Add a track</h2>
              </div>
              <Button size="icon" type="button" variant="ghost" aria-label="Close upload form" onClick={closeUpload}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid gap-5 p-5 md:p-6">
              <button
                className={`upload-dropzone grid min-h-52 place-items-center rounded-lg border border-dashed p-6 text-center transition ${
                  dragActive ? "border-primary bg-primary/12 shadow-2xl shadow-primary/10" : "border-border bg-background/35 hover:border-primary/55"
                }`}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a"
                  className="hidden"
                  type="file"
                  onChange={handleFileChange}
                />
                <span className="grid gap-4">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-lg border border-primary/35 bg-primary/12 text-primary">
                    <FileAudio className="h-8 w-8" />
                  </span>
                  <span>
                    <span className="block text-lg font-black">{uploadFile ? uploadFile.name : "Drop audio here"}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB ready to upload` : "or click to choose MP3, WAV, OGG, or M4A"}
                    </span>
                  </span>
                </span>
              </button>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-muted-foreground">
                  Title
                  <Input required value={uploadForm.title} onChange={(event) => updateUploadField("title", event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-bold text-muted-foreground">
                  Artist
                  <Input required value={uploadForm.artist} onChange={(event) => updateUploadField("artist", event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-bold text-muted-foreground">
                  Album
                  <Input value={uploadForm.album} onChange={(event) => updateUploadField("album", event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-bold text-muted-foreground">
                  Genre
                  <Select value={uploadForm.genre} onChange={(event) => updateUploadField("genre", event.target.value)}>
                    <option value="">Choose genre</option>
                    {uploadGenres.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-muted-foreground">
                  Year
                  <Input
                    min="1900"
                    max="2100"
                    type="number"
                    value={uploadForm.releaseYear}
                    onChange={(event) => updateUploadField("releaseYear", event.target.value)}
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeUpload}>
                  Cancel
                </Button>
                <Button disabled={uploading || !uploadFile} type="submit">
                  <UploadCloud className="h-4 w-4" />
                  {uploading ? "Uploading" : "Upload track"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      <PlayerBar track={currentTrack} audioUrl={audioUrl} loading={playing} />
    </main>
  );
}
