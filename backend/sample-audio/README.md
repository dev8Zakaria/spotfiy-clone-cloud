# Sample Audio

Run this from `backend/` to generate short local demo WAV files:

```bash
npm run audio:generate
```

Then upload them to MinIO:

```bash
npm run audio:upload
```

You can replace the generated files with real `.mp3`, `.wav`, `.ogg`, or `.m4a` files as long as the object keys match the database rows.
