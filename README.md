<p align="center">
  <img src="assets/icon.svg" width="96" height="96" alt="Hi-Res Audio icon">
</p>

<h1 align="center">Hi-Res Audio</h1>

A self-hosted lossless audio addon for **BitChord**. It searches its providers at once and plays whichever answers first. Runs on Cloudflare Workers or Node.js 24+, with no runtime dependencies.

> [!NOTE]
> Community project built on third-party providers. Streams can stop working without notice.

## Deploy

### Cloudflare Workers (recommended)

```bash
yarn install
yarn wrangler login
yarn wrangler secret put SECRET_ID    # paste the output of: openssl rand -hex 32
yarn deploy
```

Wrangler prints your `https://…workers.dev` URL. Keep `SECRET_ID` the same on every deploy so existing track IDs stay valid. Public settings live in `wrangler.toml`.

### Node.js or Docker

BitChord needs public HTTPS, so put the server behind a reverse proxy.

```bash
yarn install && yarn build
SECRET_ID=<your secret> PORT=8080 yarn start
```

Or with Docker: put `SECRET_ID=<your secret>` in `.env` and run `docker compose up -d --build`.

## Add it to BitChord

Open **Sources → Add addon** and paste your server's URL. To use a single provider, add its route (`/c` or `/f`) instead. Opening the URL in a browser shows a small search page with a player.

## Routes

| Route | Provider                      |
| :---: | :---------------------------- |
|  `/`  | Races Monochrome and Instable |
| `/c`  | Monochrome                    |
| `/f`  | Instable                      |

Each route serves `GET /manifest.json`, `GET /search?q=…&quality=LOSSLESS|HIGH|LOW` and `GET /stream/:id`. The root also serves `/health` and `/api/telemetry` (live up/down and latency per provider). Every response allows any origin (CORS) and `OPTIONS` preflights are answered, so browser-based clients can use the addon.

## Configuration

Set variables in the environment or `.env` (Node), or under `[vars]` in `wrangler.toml` (Workers). The server refuses to start without `SECRET_ID`.

| Variable              | Default                        | Purpose                                    |
| :-------------------- | :----------------------------- | :----------------------------------------- |
| `SECRET_ID`           | required                       | Signs track IDs. Never commit it.          |
| `PORT`, `HOST`        | `3000`, `0.0.0.0`              | Node only                                  |
| `LOG_LEVEL`           | `info`                         | `info`, `warn`, `error` or `off` (no logs) |
| `REQUEST_TIMEOUT_MS`  | `6000`                         | Per upstream request                       |
| `UPSTREAM_RETRIES`    | `1`                            | Retries per upstream request               |
| `CACHE_TTL_SECONDS`   | `300`                          | Search result cache                        |
| `MONOCHROME_BASE_URL` | `https://tracks.monochrome.st` | Provider URL                               |
| `INSTABLE_BASE_URL`   | `https://instable.arcod.xyz`   | Provider URL                               |
| `PROVIDER_MODE`       | `multi`                        | `multi`, `stub` (no upstreams) or `http`   |

`http` mode talks to one JSON provider you define with `PROVIDER_URL` (HTTPS), `PROVIDER_SEARCH_PATH`, `PROVIDER_STREAM_PATH` (use `{id}`) and an optional `PROVIDER_TOKEN`.

Logs are one JSON line each (`time`, `severity`, `msg`, and `err` when there is one). Request paths are logged, including track IDs, but never search text, query strings or stream URLs.

## Development

```bash
yarn dev          # Node, watch mode
yarn dev:worker   # real Workers runtime, needs .dev.vars (see .dev.vars.example)
yarn test         # tests, no network
yarn typecheck
```

The app is plain `Request` to `Response` code in `src/app.ts`. `src/adapters/` holds the Worker and Node entry points, and shared code avoids Node-only APIs (a test enforces it).

## Troubleshooting

| Problem                                     | Fix                                                                                                                      |
| :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------- |
| Starts then exits, or Worker answers 500    | `SECRET_ID` is missing. Set it, then check the logs (`wrangler tail` on Workers).                                        |
| Search returns 5xx                          | A provider is down. Check `/api/telemetry`.                                                                              |
| A provider works locally but not on Workers | Some providers block datacenter IPs. Use the Node build on another host.                                                 |
| Tracks stop playing                         | `SECRET_ID` changed, or this is an update from a version that issued `qobuz_` IDs. Search again to get new `track_` IDs. |

## Legal

No media is stored; the server only resolves metadata and stream URLs. Whoever deploys it is responsible for following local law and the providers' terms. Not affiliated with Qobuz, Monochrome, Instable or any other provider.

Source files and provider implementations by [Silly Kat](https://github.com/KATx-dev). Licensed under [GPL-3.0](LICENSE).
