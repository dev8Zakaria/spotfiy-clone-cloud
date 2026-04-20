CREATE TABLE "tracks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "genre" TEXT,
    "duration_seconds" INTEGER,
    "release_year" INTEGER,
    "minio_key" TEXT NOT NULL,
    "cover_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tracks_genre_idx" ON "tracks"("genre");
CREATE INDEX "tracks_artist_idx" ON "tracks"("artist");
