import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { getPlaybackUrl } from "../minio.js";

const router = Router();

const querySchema = z.object({
  q: z.string().trim().optional(),
  genre: z.string().trim().optional()
});

function serializeTrack(track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    genre: track.genre,
    durationSeconds: track.durationSeconds,
    releaseYear: track.releaseYear,
    minioKey: track.minioKey,
    coverKey: track.coverKey,
    createdAt: track.createdAt
  };
}

router.get("/", async (req, res, next) => {
  try {
    const { q, genre } = querySchema.parse(req.query);
    const where = {};

    if (genre && genre !== "all") {
      where.genre = { equals: genre, mode: "insensitive" };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { artist: { contains: q, mode: "insensitive" } },
        { album: { contains: q, mode: "insensitive" } },
        { genre: { contains: q, mode: "insensitive" } }
      ];
    }

    const tracks = await prisma.track.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    res.json({ tracks: tracks.map(serializeTrack) });
  } catch (error) {
    next(error);
  }
});

router.get("/genres", async (req, res, next) => {
  try {
    const genres = await prisma.track.findMany({
      where: { genre: { not: null } },
      distinct: ["genre"],
      select: { genre: true },
      orderBy: { genre: "asc" }
    });

    res.json({ genres: genres.map((item) => item.genre).filter(Boolean) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const track = await prisma.track.findUnique({ where: { id } });

    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    res.json({ track: serializeTrack(track) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/play", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const track = await prisma.track.findUnique({ where: { id } });

    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    const url = await getPlaybackUrl(track.minioKey);
    res.json({ url, expiresInSeconds: 3600 });
  } catch (error) {
    next(error);
  }
});

export default router;
