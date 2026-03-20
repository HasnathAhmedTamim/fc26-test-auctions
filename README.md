# FC26 Auction

Real-time football player auction platform built with Next.js App Router, NextAuth, MongoDB, and Socket.IO.

## Features

- Credentials-based authentication (register/login)
- Role-aware access:
	- `manager`: dashboard + live auction bidding.
	- `admin`: room creation + live auction controls.
- Real-time auction room updates via Socket.IO:
	- room join/state sync
	- live bidding
	- timer ticks
	- pause/resume
	- sold/skip flow
	- manager opt-out + auto-pause when all non-leading managers opt out
- Player catalog API with active edition support (e.g. `fc24`, `fc26`)
- Manager dashboard with budget and purchased players

## Tech Stack

- Next.js 16 (App Router)
- React 19
- NextAuth v5 (credentials provider)
- MongoDB Node driver
- Socket.IO
- Tailwind CSS v4
- TypeScript + Zod

## Prerequisites

- Node.js 20+
- MongoDB instance (local or Atlas)

## Environment Variables

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=replace-with-a-long-random-string
```

Notes:

- `MONGODB_URI` is required by app runtime and scripts.
- `NEXT_PUBLIC_APP_URL` is used by Socket.IO client/server CORS.
- `AUTH_SECRET` is required for stable NextAuth JWT encryption/signing.

## Installation

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

This project uses a custom server (`server.mjs`) that boots Next.js and Socket.IO together on port `3000`.

## Seed Players

Import players from a JSON file:

```bash
npm run import:players -- public/fifa24-player-list.json fc24
```

Or:

```bash
npm run import:players -- public/fc26-player-list-with-base-price.json fc26
```

The import script upserts into `players` and sets the active edition in `settings.activePlayerEdition`.

## Set Active Player Edition

```bash
npm run players:version -- fc24
```

## First Admin Setup

Public registration creates users with role `manager`.
To access `/admin`, promote a user manually in MongoDB:

```javascript
db.users.updateOne(
	{ email: "admin@example.com" },
	{ $set: { role: "admin" } }
)
```

## Available Scripts

- `npm run dev` - Start development server (`server.mjs`)
- `npm run build` - Build production assets
- `npm run start` - Start production server (`server.mjs`)
- `npm run lint` - Run ESLint
- `npm run import:players -- <file> <edition>` - Import/upsert player dataset
- `npm run players:version -- <edition>` - Set active player edition

## Main Routes

### Pages

- `/` - Landing page
- `/players` - Player catalog
- `/tournaments` - Tournament listing
- `/register` - Registration
- `/login` - Login
- `/dashboard` - Manager dashboard (auth required)
- `/admin` - Admin panel (admin only)
- `/auction/[roomId]` - Live auction room (auth required)

### API

- `POST /api/auth/register` - Register manager account
- `GET /api/players` - List players (supports `edition`, `search` query params)
- `GET /api/players/version` - Get active edition + available editions
- `POST /api/players/version` - Set active edition (admin only)
- `GET /api/dashboard` - Manager dashboard stats (auth required)
- `GET /api/auction/rooms` - List auction rooms
- `POST /api/auction/rooms` - Create auction room (admin only)
- `GET /api/auction/room/:roomId/state` - Room snapshot + recent bids
- `GET /api/admin` - Admin-protected test endpoint

## Database Collections (current usage)

- `users`
- `players`
- `settings`
- `auctionRooms`
- `bids`
- `managerStats`

## Development Notes

- Authentication middleware protects `/dashboard`, `/admin`, and `/auction/*`.
- The app DB name is `fc26-auction` (set in code).
- Default round timer is `120` seconds.
