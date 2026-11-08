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
