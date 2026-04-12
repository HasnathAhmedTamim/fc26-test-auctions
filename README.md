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

2. Create `.env.local` in project root:

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

The app runs through the custom server in `server.mjs` (Next.js + Socket.IO) on port `3000`.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string for app runtime and data scripts |
| `AUTH_SECRET` | Yes | NextAuth JWT/session encryption secret |
| `NEXT_PUBLIC_APP_URL` | Recommended | Base URL used by Socket.IO client/server CORS |
| `AUTH_URL` | Recommended | Explicit app/auth base URL fallback for redirects |
| `NEXTAUTH_URL` | Optional | Legacy URL fallback |
| `NEXTAUTH_SECRET` | Optional | Legacy/fallback secret check in middleware |
| `VERCEL_URL` | Optional | Used as redirect fallback in hosted environments |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server using `server.mjs` |
| `npm run build` | Build Next.js production assets |
| `npm run start` | Start production server using `server.mjs` |
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

- Database name is fixed in code as `fc26-auction`.
- Default round timer is `120` seconds.
- Room access checks are enforced in page guards, APIs, room queries, and socket room joins.
- Critical auction actions are validated server-side, not only in the UI.