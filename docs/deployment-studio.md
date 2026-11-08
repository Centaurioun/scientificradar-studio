# ScientificRadar Studio deployment runbook

This runbook prepares a standalone Studio release for an owner-managed host. It does not provision a server, configure DNS/TLS, publish to `scientificradar.com`, or assume a specific operating system, service manager, container runtime, storage provider, or reverse proxy. Replace the example hostnames and paths with values supplied by the server owner.

## Runtime and release artifact

- Use patched Node.js 24.x. The repository pins Node.js 24.22.2 in `.nvmrc` and constrains the supported engine to `>=24.22.2 <25`.
- Install from the committed Bun lockfile and build with Node 24 available on `PATH`:

  ```sh
  bun install --frozen-lockfile
  bun run build
  ```

- `bun run build` runs the Next.js 16 production build, then copies `public/` and `.next/static/` into `.next/standalone/`. It also includes the SQLite backup/restore CLI and its Node built-in operations module in the standalone payload.
- Transfer the complete `.next/standalone/` directory as one release artifact. It contains `server.js`, the traced runtime dependencies, public files, static assets, and the DB operations CLI. Build for a host-compatible OS and architecture when native dependencies are present; a macOS build artifact is not automatically a Linux artifact.
- If the release root contains the repository `package.json`, start it with `npm run start`, which launches `node .next/standalone/server.js`. If deploying only the standalone artifact, set the process working directory to that directory and run `node server.js`. Do not use `next start` with `output: 'standalone'`.
- Keep one Studio instance on one durable local SQLite database path. Do not point multiple hosts or independently running Studio instances at the same SQLite database, ephemeral disk, or an unverified network filesystem.

## Environment and secrets

Provide production variables through the owner’s service manager or secret store. Do not commit them to Git, put secrets in `NEXT_PUBLIC_*`, or include real credentials in a release bundle.

| Variable | Requirement |
| --- | --- |
| `NODE_ENV` | Set to `production` for secure cookies and production behavior. |
| `PORT` | Private application listen port, for example `3000`. |
| `HOSTNAME` | Bind to loopback (for example `127.0.0.1`) behind a local reverse proxy. |
| `PUBLICATION_DATABASE_PATH` | Absolute path on durable, private storage. The parent directory must be private to the service account; SQLite files are created with restricted permissions. |
| `SCIENTIFICRADAR_STUDIO_PUBLISHING_URL` | Canonical HTTPS origin seen by users, such as `https://studio.example.test`; do not include a path. |
| `STUDIO_SESSION_SECRET` | Runtime secret of at least 32 characters. Generate a high-entropy value, for example with Node 24: `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. |
| `STUDIO_BOOTSTRAP_EMAIL` | Initial owner email, needed only when creating the first owner in a new database. Remove it from runtime configuration after setup. |
| `STUDIO_BOOTSTRAP_PASSWORD` | Initial owner password, at least 14 characters. Set it through a secret store; remove it after first-owner setup. |
| `PUBLISHING_MAX_MEDIA_BYTES` | Optional upload limit; default is 8 MiB. Configure proxy request-size limits slightly above this to allow request framing overhead. |
| `NEXT_PUBLIC_SERVER_PUBLISHING_ENABLED` | Set to `true` when the Studio editor should use the authenticated server-publishing workflow. This value is embedded during `bun run build`. |
| `NEXT_PUBLIC_SCIENTIFICRADAR_STUDIO_PUBLISHING_URL` | Same canonical HTTPS origin as `SCIENTIFICRADAR_STUDIO_PUBLISHING_URL`. It is embedded during `bun run build`; rebuild when changing it. |

`GEMINI_API_KEY` is needed only for Gemini-backed assistant operations. It is not required for server-side SQLite publishing. `NEXT_PUBLIC_*` values are public and are compiled into browser assets; never place credentials in them.

For the first owner setup, use a separate, private database on a non-public staging host. Restrict the staging host at the reverse proxy or VPN, use separate staging secrets, and add `X-Robots-Tag: noindex, nofollow, noarchive`. The `noindex` header does not restrict access: keep authentication at the ingress. Do not point staging at production content, credentials, or database.

## Reverse proxy and HTTPS examples

Studio must be served over HTTPS in production because authenticated session cookies use the `Secure` attribute. Keep the Node listener private on loopback and terminate TLS at the owner-selected ingress. These are templates only; replace the host and certificate paths and adapt syntax to the installed proxy.

### Caddy template

```caddyfile
studio.example.test {
    tls /path/to/fullchain.pem /path/to/private-key.pem
    reverse_proxy 127.0.0.1:3000
}
```

For a protected staging site, add this inside the site block and configure ingress authentication separately:

```caddyfile
header X-Robots-Tag "noindex, nofollow, noarchive"
```

### Nginx template

```nginx
server {
    listen 443 ssl;
    server_name studio.example.test;
    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/private-key.pem;
    client_max_body_size 9m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

For staging only, add `add_header X-Robots-Tag "noindex, nofollow, noarchive" always;` inside the server block and separately require ingress authentication. The current application does not obtain a trusted socket peer address for IP-based login throttling. Enforce rate limits at the ingress using the actual peer connection; do not trust arbitrary client-supplied `X-Forwarded-For` values.

## Liveness and readiness smoke checks

There is no dedicated `/health` route. The homepage currently redirects to the dashboard, so follow that redirect when checking the application shell. Check the database-backed publication API separately through the canonical HTTPS origin:

```sh
STUDIO_ORIGIN="https://studio.example.test"
curl --location --max-redirs 5 --fail --silent --show-error \
  "$STUDIO_ORIGIN/" --output /dev/null
curl --fail --silent --show-error "$STUDIO_ORIGIN/api/publications" \
  --header 'Accept: application/json' --output /dev/null
```

The first request checks the HTTP server and application shell. The publication-list request initializes and reads the configured SQLite store, so a non-success response also indicates a runtime/database configuration problem. This does not test an authenticated owner action or an external publication destination.

To verify that static assets were packaged and served, run from the release root after the standalone build:

```sh
ASSET_FILE="$(find .next/standalone/.next/static -type f -print -quit)"
test -n "$ASSET_FILE"
ASSET_PATH="${ASSET_FILE#.next/standalone/.next/static/}"
STUDIO_ORIGIN="https://studio.example.test"
curl --fail --silent --show-error \
  "$STUDIO_ORIGIN/_next/static/$ASSET_PATH" --output /dev/null
```

## SQLite backup and recovery

Keep the database directory and backup directory private to the service operator. The included tool uses SQLite `VACUUM INTO` to make a consistent backup while Studio is online, verifies integrity, creates backup files with mode `0600`, and refuses to overwrite an existing destination. Run commands from the release root that contains `.next/standalone/`; the CLI is included at `.next/standalone/scripts/publication-db.mjs`. From inside the standalone directory, use `scripts/publication-db.mjs` instead.

```sh
umask 077
BACKUP_DIR="/path/to/private-backups"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
BACKUP_PATH="$BACKUP_DIR/scientificradar-$(date -u +%Y%m%dT%H%M%SZ).sqlite"
node .next/standalone/scripts/publication-db.mjs \
  backup "$PUBLICATION_DATABASE_PATH" "$BACKUP_PATH"
node .next/standalone/scripts/publication-db.mjs verify "$BACKUP_PATH"
```

For a restore, stop Studio first, verify the backup, and restore to a **new path that does not already exist**. Point `PUBLICATION_DATABASE_PATH` at the restored file before restarting:

```sh
node .next/standalone/scripts/publication-db.mjs verify "$BACKUP_PATH"
node .next/standalone/scripts/publication-db.mjs \
  restore "$BACKUP_PATH" "/path/to/private-state/scientificradar-restored.sqlite"
```

The CLI does not upload or encrypt backups. Store protected off-host copies and rehearse restore on a separate staging instance. Confirm retention, encryption, access control and recovery-point needs with the server owner.

## Rollback

Keep immutable release directories and retain the prior standalone artifact until the new release is accepted. To roll back application code, stop the current process and start the prior release while pointing it at the **same durable `PUBLICATION_DATABASE_PATH`**. This preserves review, publication, withdrawal and restore state. A normal code rollback is not a database restore.

Do not overwrite the current database with an older backup as part of routine rollback: doing so can lose newer revisions or reverse withdrawal state. If recovery from database corruption is required, stop the service, make a separate copy of the damaged database if possible, verify the selected backup, restore it to a new private path, and record that state may be older than the current system. Confirm app/database schema compatibility before switching releases.

## Validation boundary

The Node 24 standalone build and local HTTP smoke tests validate this artifact and its SQLite path. They do not verify the owner's host, process manager, proxy, certificates, storage durability, backup destination, live credentials, DNS, production site, or deployment. Confirm those details with the owner before a separate deployment task.
