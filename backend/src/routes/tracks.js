import { Router, raw } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { bucketName, ensureBucket, getPlaybackUrl, minioClient } from "../minio.js";

const router = Router();

const querySchema = z.object({
  q: z.string().trim().optional(),
  genre: z.string().trim().optional()
});

const uploadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  artist: z.string().trim().min(1).max(120),
  album: z.string().trim().max(120).optional(),
  genre: z.string().trim().max(80).optional(),
  releaseYear: z.coerce.number().int().min(1900).max(2100).optional(),
  durationSeconds: z.coerce.number().int().min(0).max(24 * 60 * 60).optional(),
  fileName: z.string().trim().min(1).max(240)
});

const allowedAudioTypes = new Map([
  ["audio/mpeg", ".mp3"],
  ["audio/mp3", ".mp3"],
  ["audio/wav", ".wav"],
  ["audio/x-wav", ".wav"],
  ["audio/ogg", ".ogg"],
  ["audio/mp4", ".m4a"],
  ["audio/x-m4a", ".m4a"]
]);

function sanitizeFilePart(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildObjectKey(fileName, contentType) {
  const extension = allowedAudioTypes.get(contentType);
  const baseName = sanitizeFilePart(fileName.replace(/\.[^.]+$/, "")) || "track";
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `uploads/${stamp}-${baseName}${extension}`;
}

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

router.post(
  "/",
  raw({ type: "audio/*", limit: "50mb" }),
  async (req, res, next) => {
    try {
      const contentType = String(req.headers["content-type"] || "").split(";")[0].toLowerCase();

      if (!allowedAudioTypes.has(contentType)) {
        return res.status(415).json({ message: "Unsupported audio type. Upload MP3, WAV, OGG, or M4A." });
      }

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ message: "Audio file is required." });
      }

      const parsedUpload = uploadSchema.safeParse(req.query);
      if (!parsedUpload.success) {
        return res.status(400).json({ message: "Title, artist, and file name are required." });
      }

      const payload = parsedUpload.data;
      const objectKey = buildObjectKey(payload.fileName, contentType);

      await ensureBucket();
      await minioClient.putObject(bucketName, objectKey, req.body, req.body.length, {
        "Content-Type": contentType
      });

      const track = await prisma.track.create({
        data: {
          title: payload.title,
          artist: payload.artist,
          album: payload.album || null,
          genre: payload.genre || null,
          releaseYear: payload.releaseYear || null,
          durationSeconds: payload.durationSeconds || null,
          minioKey: objectKey
        }
      });

      res.status(201).json({ track: serializeTrack(track) });
    } catch (error) {
      next(error);
    }
  }
);

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
