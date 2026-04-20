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
