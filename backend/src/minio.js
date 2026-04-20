import * as Minio from "minio";

const port = Number(process.env.MINIO_PORT || 9000);
const useSSL = String(process.env.MINIO_USE_SSL || "false") === "true";
const publicMinioBaseUrl = process.env.PUBLIC_MINIO_BASE_URL;

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port,
  useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  region: process.env.MINIO_REGION || "us-east-1"
});

export const bucketName = process.env.MINIO_BUCKET || "tracks";

function createPublicPresignClient() {
  if (!publicMinioBaseUrl) return minioClient;

  const url = new URL(publicMinioBaseUrl);
  const protocolIsHttps = url.protocol === "https:";
  const explicitPort = url.port ? Number(url.port) : protocolIsHttps ? 443 : 80;

  return new Minio.Client({
    endPoint: url.hostname,
    port: explicitPort,
    useSSL: protocolIsHttps,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    region: process.env.MINIO_REGION || "us-east-1"
  });
}

export async function getPlaybackUrl(objectKey) {
  const client = createPublicPresignClient();
  const signedUrl = await client.presignedGetObject(bucketName, objectKey, 60 * 60);

  if (!publicMinioBaseUrl) {
    return signedUrl;
  }

  const baseUrl = new URL(publicMinioBaseUrl);
  const browserUrl = new URL(signedUrl);
  const prefix = baseUrl.pathname.replace(/\/$/, "");

  browserUrl.pathname = `${prefix}${browserUrl.pathname}`;
  return browserUrl.toString();
}

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
  }
}
