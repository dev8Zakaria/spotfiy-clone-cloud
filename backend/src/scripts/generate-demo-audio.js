import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("sample-audio", "demo");

const tones = [
  { file: "cloud-city.wav", frequency: 261.63 },
  { file: "reverse-proxy.wav", frequency: 329.63 },
  { file: "object-storage.wav", frequency: 392.0 }
];

function writeString(buffer, offset, value) {
  for (let i = 0; i < value.length; i += 1) {
    buffer.writeUInt8(value.charCodeAt(i), offset + i);
  }
}

function createWav({ frequency, seconds = 8, sampleRate = 44100 }) {
  const sampleCount = seconds * sampleRate;
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  writeString(buffer, 0, "RIFF");
  buffer.writeUInt32LE(36 + dataSize, 4);
  writeString(buffer, 8, "WAVE");
  writeString(buffer, 12, "fmt ");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  writeString(buffer, 36, "data");
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < sampleCount; i += 1) {
    const fade = Math.min(1, i / 8000, (sampleCount - i) / 8000);
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.22 * fade;
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }

  return buffer;
}

await fs.mkdir(outputDir, { recursive: true });

for (const tone of tones) {
  const filePath = path.join(outputDir, tone.file);
  await fs.writeFile(filePath, createWav(tone));
  console.log(`Generated ${filePath}`);
}
