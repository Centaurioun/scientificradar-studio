# Studio server publishing (local integration)

The server publishing routes use Node.js 24 or newer, a durable SQLite database, server-managed users and roles, and HttpOnly sessions. They do not use IndexedDB as publication authority. In development, the default database path is `./data/scientificradar-publications.sqlite`; it is ignored by Git. Set `PUBLICATION_DATABASE_PATH` to a durable mounted path when running the application outside a disposable local checkout.

Set these values in `.env.local` before starting the Studio server:

| Variable | Purpose |
| --- | --- |
| `PUBLICATION_DATABASE_PATH` | Durable SQLite file path. |
| `SCIENTIFICRADAR_STUDIO_PUBLISHING_URL` | Canonical Studio API/media origin. Development may use `http://localhost:3000`; deployed use must be HTTPS. |
| `STUDIO_SESSION_SECRET` | At least 32 characters; used to HMAC session tokens before storing them. |
| `STUDIO_BOOTSTRAP_EMAIL` | Initial owner account, created only while the database has no owner. |
| `STUDIO_BOOTSTRAP_PASSWORD` | Initial owner password; at least 14 characters. |
| `PUBLISHING_MAX_MEDIA_BYTES` | Image upload cap (default 8 MiB). |
| `NEXT_PUBLIC_SERVER_PUBLISHING_ENABLED` | Enables the Studio client bridge when set to `true`. |
| `NEXT_PUBLIC_SCIENTIFICRADAR_STUDIO_PUBLISHING_URL` | Public canonical Studio origin used to validate existing immutable media URLs in the bridge. |

The route flow is `POST /api/studio/auth/session` → `POST /api/studio/media-assets` → `POST /api/studio/media-evidence` (owner or rights reviewer) → `PUT /api/studio/publications/:articleId` → `POST /api/studio/publications/:articleId/review` → `POST /api/studio/publications/:articleId/publish`. Public consumers use `GET /api/publications`, `GET /api/publications/:slug`, and immutable media URLs under `/api/public/media/:assetRevisionId`. Public responses are `no-store`; withdrawal removes the active snapshot and image access, and restore reactivates the preserved revision.

Local tests use temporary SQLite files and synthetic image bytes/evidence IDs only. The tests verify storage and authorization behavior; they do not establish real asset rights. A production deployment still needs an explicitly provisioned persistent database volume/shared database and protected secrets. SQLite on a single durable host is a local integration implementation, not a multi-instance serverless database service.

## Single-node backup and restore

Back up the database to a private directory while the application is running (SQLite `VACUUM INTO` includes committed WAL content in a consistent snapshot):

```sh
node scripts/publication-db.mjs backup "$PUBLICATION_DATABASE_PATH" /secure-backups/scientificradar-$(date +%Y%m%d-%H%M%S).sqlite
node scripts/publication-db.mjs verify /secure-backups/scientificradar-YYYYMMDD-HHMMSS.sqlite
```

For restore, stop the Studio process first, verify the backup, then restore to a new path that does not already exist. Point `PUBLICATION_DATABASE_PATH` to that restored file and start Studio. The utility refuses to overwrite an existing database, creates files with mode `0600`, requires private parent directories, and runs `PRAGMA integrity_check` before and after copy. Keep encrypted off-host backup copies and periodically rehearse restore on a separate staging host; this utility does not upload backups or prove filesystem durability.

Failed login attempts are bounded by normalized account key and pruned to a configurable in-memory-independent table size. The current Next route does not expose a trusted socket peer address, so do not trust client-supplied `X-Forwarded-For` for IP throttling; production ingress must provide network-level rate limiting until a verified proxy adapter is implemented. Cookies are HttpOnly, SameSite=Strict, Secure in production, and sessions expire after 12 hours; role and disabled-user state are re-read on each request.
