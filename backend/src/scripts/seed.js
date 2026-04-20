import "dotenv/config";
import { prisma } from "../db.js";

const tracks = [
  {
    title: "Cloud City",
    artist: "ENSA Waves",
    album: "Distributed Sessions",
    genre: "Electronic",
    durationSeconds: 214,
    releaseYear: 2026,
    minioKey: "demo/cloud-city.wav"
  },
  {
    title: "Reverse Proxy",
    artist: "The Gateways",
    album: "Layer Seven",
    genre: "Rock",
    durationSeconds: 189,
    releaseYear: 2025,
    minioKey: "demo/reverse-proxy.wav"
  },
  {
    title: "Object Storage",
    artist: "MinIO Quartet",
    album: "Buckets",
    genre: "Jazz",
    durationSeconds: 242,
    releaseYear: 2024,
    minioKey: "demo/object-storage.wav"
  }
];

async function main() {
  for (const [index, track] of tracks.entries()) {
    await prisma.track.upsert({
      where: { id: index + 1 },
      update: track,
      create: track
    });
  }

  console.log(`Seeded ${tracks.length} demo tracks.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
