# HealthX-Intel
Sally AI from [console.a1c.io](console.a1c.io) x X MCP

A personal dashboard that monitors **health influencers on X**, cross-references their advice
against **your own biomarkers via Sally (A1C)**, and flags **risky emerging health trends** — with a
dark, Chillax-typed UI and a live 5-minute sync.

> **Information only — not medical advice.** Every score is a transparent heuristic. Verify anything
> important with a qualified clinician.
>

demo: [healthX-intel](https://healthx-intel.0xcynyx.tech/)

---

## What it does

- **Influencer Monitor** — tracks a watchlist of X accounts, pulls their recent posts, tags themes
  (sleep, glucose, supplements, fasting, …), scores each post for risk, and computes an **alignment
  score** between their advice and your Sally weak areas.
- **Risk Detector** — runs a panel of monitored searches for questionable advice ("reverse diabetes",
  "seed oils are poison", detox products, unproven Ozempic alternatives, …), scores the matches, and
  cross-references reputable guidelines (ADA, AASM, NIH ODS, FDA, WHO).
- **Your Sally snapshot** — readiness, recovery, sleep, body energy, CGM/time-in-range (when synced),
  and auto-derived "weak areas" that drive the alignment scoring.
- **Trends & History** — alignment trajectory, risk volume, and live X trends.
- **Reports** — one-click Markdown export of the day's snapshot.
- **Last sync + auto-refresh** — the header shows "last sync N min ago"; data auto-pulls every
  5 minutes, with a manual **Sync now** button.

## Architecture (short version)

```
Browser ── SWR /api/overview (auto-refresh 5m) ──▶ Next.js route handlers
                                                       │
                            ┌──────────────────────────┼───────────────────────────┐
                            ▼                           ▼                           ▼
                     lib/x.ts (X API v2)        lib/sally.ts (Sally MCP)     lib/analyze.ts
                  app-only bearer + reads     JSON-RPC tools/call over HTTP   rule-based scoring
```

- **Live by default**, with graceful fallback to a seeded snapshot when a key is missing or a call
  fails (per-source, never a blank screen).
- **No runtime LLM** — scoring is deterministic and reproducible, so it runs on Vercel with no extra
  cost and no hallucination.
- See [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) for the full data flow, module map, and scoring method.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in keys (see below)
npm run dev                  # http://localhost:3001
```

### Environment variables

| Var | Required | What |
| --- | --- | --- |
| `X_CONSUMER_KEY` / `X_CONSUMER_SECRET` | for X | Your X app's OAuth2 client credentials. The server mints an **app-only bearer** for public reads. |
| `X_BEARER_TOKEN` | optional | Pre-minted app-only bearer; skips the exchange if set. |
| `X_TRENDS_WOEID` | optional | Trends location. `1` = worldwide, `23424977` = US. |
| `SALLY_MCP_URL` | for Sally | Defaults to `https://sally.a1c.io/mcp`. |
| `SALLY_API_KEY` | for Sally | Key minted at [console.a1c.io](https://console.a1c.io). Calls are metered — top up your balance. |
| `SALLY_TIMEZONE` | optional | IANA tz for insight timing. |
| `SYNC_INTERVAL_MS` | optional | Cache TTL + client refresh cadence. Default `300000` (5 min). |

## Notes & limitations

- **X access tier**: app-only reads (user lookup, timelines, recent search, trends) require at least
  Basic tier. On a lower tier some endpoints return 403 — the app degrades to the seeded snapshot.
- **CGM**: if no sensor is synced to Sally, metabolic scoring is paused and shown as "no CGM data".
- **Watchlist** is stored in an httpOnly cookie (no DB). Great for single-user personal use; swap for
  Vercel KV if this goes multi-user.
- **Rate limits**: a 5-minute cache keeps X calls well within limits for personal use.
