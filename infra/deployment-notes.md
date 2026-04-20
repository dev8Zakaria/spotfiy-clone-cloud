# Deployment Notes

## VM1 Gateway/App

```bash
ssh gateway
sudo apt update
sudo apt install -y nginx docker.io docker-compose-plugin
sudo systemctl enable --now nginx docker
```

Copy `infra/nginx/ensa-platform.conf` to `/etc/nginx/sites-available/ensa-platform`, enable it, and reload Nginx.

```bash
sudo ln -s /etc/nginx/sites-available/ensa-platform /etc/nginx/sites-enabled/ensa-platform
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Build the frontend and copy `frontend/dist` to `/var/www/html`.

Start the API:

```bash
docker compose -f docker-compose.vm1.yml up -d --build
```

For public audio playback through Cloudflare Tunnel, set this in `backend/.env` on VM1:

```env
PUBLIC_MINIO_BASE_URL=https://YOUR_PUBLIC_APP_DOMAIN/media
```

The `/media/` Nginx location proxies requests from VM1 to MinIO on VM3.

Use passwords without URL-reserved characters for the class demo unless you deliberately encode them in `DATABASE_URL`.

## VM2 Database

```bash
ssh database
docker compose -f docker-compose.vm2.yml up -d
```

Run Prisma migrations from VM1 or your local machine when it can reach VM2:

```bash
cd backend
npx prisma migrate deploy
npm run demo:prepare
```

If Prisma migration fails locally on Windows, apply the SQL directly:

```bash
Get-Content backend/prisma/migrations/20260420210000_init/migration.sql | docker exec -i spotify-local-postgres psql -U spotify_app -d spotify
Get-Content backend/prisma/seed.sql | docker exec -i spotify-local-postgres psql -U spotify_app -d spotify
```

## VM3 Storage

```bash
ssh storage
docker compose -f docker-compose.vm3.yml up -d
```

Create the `tracks` bucket in the MinIO console or with `mc`.

## Local Smoke Test

```bash
docker compose -f docker-compose.local.yml up -d
cd backend
copy .env.example .env
npx prisma migrate deploy
npm run demo:prepare
npm run dev
```

In another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.
