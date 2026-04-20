import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureBucket, minioClient, bucketName } from "../minio.js";

const audioRoot = path.resolve("sample-audio");
const contentTypes = new Map([
  [".mp3", "audio/mpeg"],
  [".wav", "audio/wav"],
  [".ogg", "audio/ogg"],
  [".m4a", "audio/mp4"]
]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (contentTypes.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

await ensureBucket();

const files = await walk(audioRoot);

for (const filePath of files) {
  const objectKey = path.relative(audioRoot, filePath).replaceAll(path.sep, "/");
  const stat = await fs.stat(filePath);
  const contentType = contentTypes.get(path.extname(filePath).toLowerCase());

  await minioClient.fPutObject(bucketName, objectKey, filePath, {
    "Content-Type": contentType,
    "Content-Length": stat.size
  });

  console.log(`Uploaded ${objectKey} to bucket ${bucketName}`);
}

console.log(`Uploaded ${files.length} audio file(s).`);
