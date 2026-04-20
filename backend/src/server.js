import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import client from "prom-client";
import tracksRouter from "./routes/tracks.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { prisma } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3001);

client.collectDefaultMetrics();
const httpRequestDuration = new client.Histogram({
  name: "spotify_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
  });
  next();
});

app.get("/health", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", service: "spotify-api" });
  } catch (error) {
    next(error);
  }
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.use("/api/tracks", tracksRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(port, "0.0.0.0", () => {
  console.log(`Spotify API listening on port ${port}`);
});
