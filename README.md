# FC26 Auction (Testing Phase)

Real-time football player auction platform built with Next.js App Router, NextAuth, MongoDB, and Socket.IO.

## Overview

FC26 Auction supports a full manager/admin workflow:

- Managers can register, join allowed rooms, bid in live auctions, and manage lineup + achievements.
- Admins can create and control rooms, manage player editions, control room access, and manage tournaments.
- Socket events and REST endpoints enforce role and access checks server-side.

## Core Capabilities

### Authentication and authorization

- Credentials-based login and registration.
- Role model:
  - `manager`: dashboard, room participation, bidding.
  - `admin`: room controls and admin modules.
- Middleware protection for private routes (`/dashboard`, `/admin`, `/auction/*`).

### Live auction engine

- Real-time room state sync over Socket.IO.
- Bid updates, timer ticks, sold/skip actions, and pause/resume.
- Manager opt-out support with auto-pause when everyone except leader opts out.
- Server-side guardrails:
  - socket identity/session binding
  - anti-spoof bid checks
  - strict bid increment + cooldown rules
  - atomic/race-safe update filters
  - sold/duplicate ownership protections

### Player, dashboard, and tournament workflows

- Edition-aware player catalog with active edition switching (for example `fc24`, `fc26`).
- Manager dashboard for budget, room status, lineup builder, and achievements.
- Admin modules for users, room access, manager stats, runtime settings, and tournaments.
- Tournament fixtures/standings customization from admin UI.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- NextAuth v5 (credentials provider)
- MongoDB Node driver
- Socket.IO
- Tailwind CSS v4
- TypeScript + Zod
- Vitest + ESLint

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your values:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
AUTH_SECRET=replace-with-a-long-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
```

3. Start development server:

```bash
npm run dev
```

The app runs through the custom server in `server/index.mjs` (Next.js + Socket.IO) on port `3000`. The root `server.mjs` re-exports the modular server entry point.

## Project Structure

```
src/
  app/
    (public)/          # Marketing/auth pages (login, register, players, tournaments)
    (app)/             # Authenticated app pages (dashboard, admin, auction)
    api/               # Route handlers
  components/
    features/admin/    # Admin panel tabs + useAdminPanel hook
    auction/           # Auction room UI
  hooks/               # Shared React hooks (e.g. useAuctionSocket, useFetchJson)
  lib/                 # DB helpers, auth, validations, auction settings
  services/            # Data-access layer used by API routes
  types/               # Shared TypeScript types

server/
  index.mjs            # HTTP + Socket.IO bootstrap
  lib/db.mjs           # Server-side Mongo helpers
  socket/              # Socket auth, room runtime, event handlers
```

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string for app runtime and data scripts |
| `AUTH_SECRET` | Yes | NextAuth JWT/session encryption secret |
| `NEXT_PUBLIC_APP_URL` | Recommended | Public site URL (auth redirects, server CORS) |
| `NEXT_PUBLIC_SOCKET_URL` | Optional | Socket.IO URL if different from app URL; browser defaults to current origin |
| `AUTH_URL` | Recommended | Explicit app/auth base URL fallback for redirects |
| `PORT` | Optional | HTTP port for `npm start` (set automatically on Render/Railway) |
| `BIND_HOST` | Optional | HTTP bind address for `npm start` (default `0.0.0.0`; do not set to `HOSTNAME`) |
| `MONGODB_DNS_SERVERS` | Optional | Windows/local SRV DNS workaround (`8.8.8.8,1.1.1.1`) |
| `NEXTAUTH_URL` | Optional | Legacy URL fallback |
| `NEXTAUTH_SECRET` | Optional | Legacy/fallback secret check in middleware |
| `VERCEL_URL` | Optional | Used as redirect fallback in hosted environments |

### Production (live auction)

**Vercel alone cannot run live auctions.** Socket.IO needs the custom Node server in `server/index.mjs` (`npm start`). Deploy the **full app** to **Render** or **Railway**, then use that URL for everyone (managers, admins).

#### Render (recommended)

1. Push this repo to GitHub (already done).
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect repo (uses `render.yaml`).
3. Set **`MONGODB_URI`** when prompted (same Atlas URI as local).
4. After first deploy, open the service URL (e.g. `https://fc26-auction.onrender.com`).
5. Set environment variables to that exact URL (no trailing slash):
   ```env
   AUTH_URL=https://fc26-auction.onrender.com
   NEXT_PUBLIC_APP_URL=https://fc26-auction.onrender.com
   ```
6. Redeploy. Open `/auction/{roomId}` — socket badge should show **Connected**.

#### Render 502 troubleshooting

If you see **HTTP 502**:

1. **Render → your service → Logs** — look for `MONGODB_URI is missing`, `AUTH_SECRET is missing`, or MongoDB connection errors.
2. **Environment variables** (required):
   ```env
   MONGODB_URI=mongodb+srv://...
   AUTH_SECRET=<long random string>
   AUTH_URL=https://fc26-test-auctions.onrender.com
   NEXT_PUBLIC_APP_URL=https://fc26-test-auctions.onrender.com
   ```
3. **MongoDB Atlas → Network Access** → add **`0.0.0.0/0`** (allow Render’s dynamic IPs).
4. **Redeploy** after saving env vars (Manual Deploy → Deploy latest commit).
5. Check **`https://your-app.onrender.com/health`** — should return `ok` when running.

Free tier cold starts can take 30–60 seconds after idle; wait and refresh once.

#### Railway

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub** → select repo.
2. Railway reads `railway.toml` (`npm ci && npm run build`, `npm start`).
3. Add variables: `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL` (your Railway URL).
4. Generate a public domain in Railway settings, then set `AUTH_URL` / `NEXT_PUBLIC_APP_URL` to that URL and redeploy.

#### Player data on production

```bash
npm run import:players -- public/lower-rated-players.json lower-rated
npm run players:version -- lower-rated
```

Run against production MongoDB (same `MONGODB_URI`), or switch edition in **Admin → Settings**.

#### Vercel (optional, no live auction)

You can keep Vercel for previews, but **managers must use the Render/Railway URL** for auction rooms. Vercel deploys do not run Socket.IO.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server using `server/index.mjs` |
| `npm run build` | Build Next.js production assets |
| `npm run start` | Start production server using `server/index.mjs` |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest test suite |
| `npm run import:players -- <file> <edition>` | Import/upsert players from JSON and set active edition |
| `npm run players:version -- <edition>` | Set active player edition |
| `node -r dotenv/config scripts/migrate-room-timer.mjs` | One-off maintenance: bump room timers below 120 |

## Player Data Workflow

Import player data (example commands):

```bash
npm run import:players -- public/fifa24-player-list.json fc24
npm run import:players -- public/fc26-player-list-with-base-price.json fc26
```

Switch active edition:

```bash
npm run players:version -- fc24
```

## First Admin Setup

Public registration creates users with role `manager` by default.

Promote an account manually in MongoDB:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
);
```

## Main Routes

### Public pages

- `/`
- `/login`
- `/register`
- `/players`
- `/players/compare`
- `/players/[id]`
- `/tournaments`

### Protected pages

- `/dashboard`
- `/dashboard/lineup`
- `/dashboard/achievements`
- `/auction/[roomId]`

### Admin pages

- `/admin`
- `/admin/settings`

## API Endpoints

### Auth

- `POST /api/auth/register`
- `GET,POST /api/auth/[...nextauth]`

### Players

- `GET /api/players`
- `GET /api/players/version`
- `POST /api/players/version` (admin only)

### Dashboard

- `GET /api/dashboard`
- `GET /api/dashboard/lineup`
- `PUT /api/dashboard/lineup`
- `GET /api/dashboard/achievements`

### Auction

- `GET /api/auction/rooms`
- `POST /api/auction/rooms` (admin only)
- `DELETE /api/auction/rooms` (admin only)
- `GET /api/auction/room/[roomId]/state`
- `GET /api/auction/room/[roomId]/manager-state`

### Admin

- `GET /api/admin`
- `GET,PATCH /api/admin/settings`
- `GET,POST /api/admin/room-access`
- `GET,POST,PATCH /api/admin/manager-stats`
- `GET,POST,PATCH,DELETE /api/admin/users`
- `GET,POST,DELETE /api/admin/achievements`
- `GET,POST,PATCH,DELETE /api/admin/tournaments`

### Diagnostics

- `GET /api/test-db`

## Database Collections

- `users`
- `players`
- `settings`
- `auctionRooms`
- `bids`
- `managerStats`
- `soldPlayers`
- `adminAuditLog`
- `roomAccess`
- `lineups`
- `userAchievements`
- `tournaments`

## Development Notes

- Database name is configured in `src/lib/db/constants.ts` as `fc26-auction`.
- Default round timer is `120` seconds.
- Room access checks are enforced in page guards, APIs, room queries, and socket room joins.
- Critical auction actions are validated server-side, not only in the UI.