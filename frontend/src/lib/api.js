export async function getTracks({ q = "", genre = "all" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (genre && genre !== "all") params.set("genre", genre);

  const response = await fetch(`/api/tracks?${params.toString()}`);
  if (!response.ok) throw new Error("Could not load tracks");
  return response.json();
}

export async function getGenres() {
  const response = await fetch("/api/tracks/genres");
  if (!response.ok) throw new Error("Could not load genres");
  return response.json();
}

export async function getPlaybackUrl(trackId) {
  const response = await fetch(`/api/tracks/${trackId}/play`);
  if (!response.ok) throw new Error("Could not start playback");
  return response.json();
}

export async function uploadTrack({ file, title, artist, album, genre, releaseYear, durationSeconds }) {
  const params = new URLSearchParams({
    title,
    artist,
    fileName: file.name
  });

  if (album) params.set("album", album);
  if (genre) params.set("genre", genre);
  if (releaseYear) params.set("releaseYear", releaseYear);
  if (durationSeconds) params.set("durationSeconds", durationSeconds);

  const response = await fetch(`/api/tracks?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "audio/mpeg"
    },
    body: file
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Could not upload track");
  }

  return response.json();
}
