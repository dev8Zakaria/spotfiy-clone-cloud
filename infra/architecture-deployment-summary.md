# Spotify Clone Cloud Architecture And Deployment Summary

This document explains the final deployed architecture for the Spotify clone cloud project. It focuses on the purpose of each VM, the files that define the deployment, the role of each service, and the flow of requests and data through the system.

## High-Level Architecture

The application is split across four virtual machines:

| VM | Role | Main Services |
| --- | --- | --- |
| VM1 Gateway/App | Public entry point and application server | Nginx, React static frontend, Express API, Cloudflare Tunnel, node-exporter |
| VM2 Database | Persistent relational data | PostgreSQL, node-exporter |
| VM3 Storage | Object storage for audio files | MinIO, node-exporter |
| VM4 Monitoring | Metrics and dashboards | Prometheus, Grafana, node-exporter |

The architecture separates responsibilities cleanly:

- VM1 receives user traffic and routes it to the correct internal service.
- VM2 stores structured application data such as tracks, artists, albums, genres, durations, and MinIO object keys.
- VM3 stores the actual audio objects in MinIO.
- VM4 collects infrastructure and application metrics and presents dashboards.

The final result is a publicly accessible music streaming demo where users open a Cloudflare URL, browse tracks, and play audio stored in MinIO.

## Network View

The main request path is:

```text
Public browser
  -> Cloudflare
  -> cloudflared tunnel on VM1
  -> Nginx on VM1
  -> React frontend / Express API / MinIO media proxy
```

Internal service communication looks like this:

```text
VM1 Express API
  -> VM2 PostgreSQL on port 5432
  -> VM3 MinIO on port 9000

VM4 Prometheus
  -> VM1 /metrics through Nginx
  -> VM1 node-exporter on port 9100
  -> VM2 node-exporter on port 9100
  -> VM3 node-exporter on port 9100
  -> VM4 node-exporter on port 9100
```

The public user does not directly access VM2 or VM3. All browser traffic goes through VM1.

## VM1 Gateway/App

VM1 is the main entry point of the system. It runs Nginx, serves the built frontend, runs the backend API container, and hosts the Cloudflare Tunnel process.

### Responsibilities

- Serve the React/Vite frontend from `/var/www/html`.
- Proxy `/api/` requests to the Express API container on port `3001`.
- Proxy `/health` and `/metrics` to the backend API.
- Proxy `/media/` requests to MinIO on VM3.
- Expose the app publicly through Cloudflare Tunnel.
- Expose VM-level metrics through node-exporter.

### Important Files

- `docker-compose.vm1.yml`
  - Defines the `spotify-api` container.
  - Builds the backend from the `backend/` folder.
  - Loads runtime configuration from `backend/.env`.

- `backend/.env`
  - Holds production runtime configuration for the API.
  - Points the API to VM2 PostgreSQL and VM3 MinIO.
  - Defines `PUBLIC_MINIO_BASE_URL`, which controls the public audio URLs returned to the browser.

- `backend/Dockerfile`
  - Builds the API image.
  - Installs Node dependencies.
  - Generates the Prisma client.
  - Installs OpenSSL so Prisma works correctly inside the Alpine container.

- `infra/nginx/ensa-platform.conf`
  - Defines Nginx routing.
  - Serves the frontend.
  - Proxies `/api`, `/health`, `/metrics`, and `/media`.

- `frontend/dist/`
  - Contains the production React build copied into `/var/www/html`.

- `docker-compose.node-exporter.yml`
  - Runs node-exporter on VM1 for infrastructure monitoring.

### Conceptual Role

VM1 is the only VM that public users need to reach. It hides the internal layout of the system and presents one coherent web application.

Nginx acts as the internal router:

```text
/        -> React frontend files
/api     -> Express API container
/health  -> Express API health endpoint
/metrics -> Express API metrics endpoint
/media   -> MinIO objects on VM3
```

Cloudflare Tunnel connects the public internet to VM1 without requiring router port forwarding or a public IP address on the VM.

## VM2 Database

VM2 runs PostgreSQL in Docker. It stores the structured data needed by the app.

### Responsibilities

- Store track metadata.
- Store title, artist, album, genre, duration, release year, and MinIO object key.
- Persist data using a Docker volume.
- Expose VM-level metrics through node-exporter.

### Important Files

- `docker-compose.vm2.yml`
  - Defines the `spotify-postgres` container.
  - Creates the `spotify` database.
  - Creates the `spotify_app` user.
  - Persists data in the `postgres_data` Docker volume.

- `backend/prisma/schema.prisma`
  - Defines the database schema used by the backend.
  - Maps the `Track` model to the `tracks` table.

- `backend/prisma/migrations/`
  - Contains the migration used to create the database schema.

- `docker-compose.node-exporter.yml`
  - Runs node-exporter on VM2 for infrastructure monitoring.

### Conceptual Role

VM2 is the source of truth for application metadata. Audio files are not stored in PostgreSQL. Instead, PostgreSQL stores the `minioKey`, which tells the backend where the matching audio file lives in MinIO.

Example relationship:

```text
Track row in PostgreSQL
  title: Cloud City
  artist: ENSA Waves
  minioKey: demo/cloud-city.wav

Audio object in MinIO
  bucket: tracks
  object: demo/cloud-city.wav
```

## VM3 Storage

VM3 runs MinIO, an S3-compatible object storage service. It stores the actual audio files.

### Responsibilities

- Store WAV audio files.
- Provide an S3-compatible API on port `9000`.
- Provide a web console on port `9001`.
- Host the `tracks` bucket used by the application.
- Expose VM-level metrics through node-exporter.

### Important Files

- `docker-compose.vm3.yml`
  - Defines the `spotify-minio` container.
  - Starts MinIO with API port `9000` and console port `9001`.
  - Persists object data in the `minio_data` Docker volume.

- `backend/src/minio.js`
  - Configures the backend MinIO client.
  - Handles bucket checks.
  - Generates public playback URLs.

- `backend/src/scripts/upload-audio.js`
  - Uploads generated demo audio files into the `tracks` bucket.

- `docker-compose.node-exporter.yml`
  - Runs node-exporter on VM3 for infrastructure monitoring.

### MinIO Bucket Concept

A MinIO bucket is a top-level container for objects. In this project, the bucket is named:

```text
tracks
```

The bucket contains objects like:

```text
demo/cloud-city.wav
demo/reverse-proxy.wav
demo/object-storage.wav
```

The backend stores object keys in PostgreSQL and uses MinIO to generate URLs for playback.

## VM4 Monitoring

VM4 runs the monitoring stack.

### Responsibilities

- Run Prometheus to collect metrics.
- Run Grafana to visualize metrics.
- Run node-exporter to expose VM4 host metrics.
- Scrape node-exporter metrics from VM1, VM2, VM3, and VM4.
- Scrape application metrics from the Express API through VM1 Nginx.

### Important Files

- `docker-compose.vm4.yml`
  - Defines Prometheus, Grafana, and VM4 node-exporter.
  - Persists Prometheus and Grafana data in Docker volumes.

- `infra/monitoring/prometheus.yml`
  - Defines Prometheus scrape targets.
  - Includes VM node-exporter targets.
  - Includes the Spotify API metrics endpoint.

- `docker-compose.node-exporter.yml`
  - Used on VM1, VM2, and VM3 so each VM exposes host metrics.

### Conceptual Role

Prometheus collects metrics. Grafana visualizes them.

Prometheus answers questions like:

- Is each VM reachable?
- Is node-exporter running?
- Is the API exposing metrics?
- How much CPU, memory, disk, and network activity is each VM using?

Grafana turns those metrics into dashboards for monitoring the health of the whole deployment.

## Public Access With Cloudflare Tunnel

The application is publicly exposed through Cloudflare Tunnel.

### Cloudflare vs cloudflared

Cloudflare is the public platform that receives internet traffic.

`cloudflared` is the tunnel client installed on VM1. It creates an outbound encrypted tunnel from VM1 to Cloudflare.

The public flow is:

```text
Browser
  -> Cloudflare public URL
  -> Cloudflare edge
  -> cloudflared tunnel
  -> VM1 Nginx
```

This avoids the need for public VM IPs or router port forwarding.

### Temporary Tunnel

For the demo, a temporary Cloudflare URL was used through a quick tunnel. This kind of URL works as long as the `cloudflared` process stays running.

When the temporary URL changes, the backend must also be updated:

```env
PUBLIC_MINIO_BASE_URL=https://CURRENT_CLOUDFLARE_URL/media
```

This matters because the backend returns audio playback URLs to the browser. External users cannot use Tailscale-only URLs such as `http://100.x.x.x/media`.

## Application Data Flow

### Loading The Page

```text
1. Browser opens the Cloudflare URL.
2. Cloudflare forwards the request through cloudflared to VM1.
3. Nginx serves the React frontend from /var/www/html.
4. React starts in the browser.
```

### Loading Tracks

```text
1. React calls /api/tracks.
2. Nginx proxies the request to the Express API container.
3. Express queries PostgreSQL on VM2 through Prisma.
4. PostgreSQL returns track metadata.
5. Express returns JSON to React.
6. React renders the track list.
```

### Playing Audio

```text
1. User clicks a track.
2. React calls /api/tracks/:id/play.
3. Express reads the track's minioKey from PostgreSQL.
4. Express creates a temporary MinIO-compatible playback URL.
5. The URL uses PUBLIC_MINIO_BASE_URL, pointing to /media on the public domain.
6. Browser requests /media/tracks/<object-key>.
7. Cloudflare sends the request to VM1.
8. Nginx proxies /media to MinIO on VM3.
9. MinIO streams the WAV file back through Nginx and Cloudflare.
10. Browser plays the audio.
```

## Monitoring Data Flow

```text
1. node-exporter runs on each VM and exposes host metrics on port 9100.
2. The Express API exposes app metrics on /metrics.
3. Prometheus on VM4 scrapes all configured targets.
4. Grafana connects to Prometheus as a data source.
5. Grafana dashboards display infrastructure and application health.
```

## Key Runtime Ports

| Port | Service | VM |
| --- | --- | --- |
| 80 | Nginx public app gateway | VM1 |
| 3001 | Express API container | VM1 |
| 5432 | PostgreSQL | VM2 |
| 9000 | MinIO S3 API | VM3 |
| 9001 | MinIO web console | VM3 |
| 9090 | Prometheus | VM4 |
| 3000 | Grafana | VM4 |
| 9100 | node-exporter | all VMs |

## Final Result

At the end of the deployment:

- The frontend is served by Nginx on VM1.
- The backend API runs in Docker on VM1.
- PostgreSQL runs in Docker on VM2.
- MinIO runs in Docker on VM3 and stores the audio files.
- Cloudflare Tunnel exposes the app publicly without direct public VM access.
- Prometheus and Grafana run on VM4 for monitoring.
- node-exporter runs on all VMs.
- The browser can load tracks from PostgreSQL and play audio from MinIO through the public Cloudflare URL.

The system is therefore a complete multi-VM cloud deployment with separate gateway, application, database, object storage, and monitoring responsibilities.
