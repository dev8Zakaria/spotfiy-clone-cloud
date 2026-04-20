INSERT INTO "tracks" ("id", "title", "artist", "album", "genre", "duration_seconds", "release_year", "minio_key")
VALUES
  (1, 'Cloud City', 'ENSA Waves', 'Distributed Sessions', 'Electronic', 214, 2026, 'demo/cloud-city.wav'),
  (2, 'Reverse Proxy', 'The Gateways', 'Layer Seven', 'Rock', 189, 2025, 'demo/reverse-proxy.wav'),
  (3, 'Object Storage', 'MinIO Quartet', 'Buckets', 'Jazz', 242, 2024, 'demo/object-storage.wav')
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "artist" = EXCLUDED."artist",
  "album" = EXCLUDED."album",
  "genre" = EXCLUDED."genre",
  "duration_seconds" = EXCLUDED."duration_seconds",
  "release_year" = EXCLUDED."release_year",
  "minio_key" = EXCLUDED."minio_key";
