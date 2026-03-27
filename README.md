# FC26 Auction

A real-time football player auction platform built with Next.js App Router, NextAuth, MongoDB, and Socket.IO.

## What This Project Does

- Lets managers register and bid in live auction rooms.
- Lets admins create rooms and control auction flow.
- Lets admins control room-level access for each manager.
- Lets managers build room-specific lineups and track achievements.
- Lets admins create, customize, and delete tournament fixtures/standings.
- Keeps all bidders synced in real time (state, timer, bids, pause/resume, sold/skip).
- Protects critical actions with server-side auth and validation rules.

## Core Features

### Authentication and Roles

- Credentials-based registration and login.
- Two roles:
  - `manager`: dashboard access and auction bidding.
  - `admin`: room creation and live auction controls.

### Real-Time Auction Flow

- Room join and state synchronization.
- Live bidding updates.
- Round timer ticks.
- Pause and resume controls.
- Mark player as sold or skip player.
- Manager opt-out.
- Auto-pause when all non-leading managers opt out.

### Realtime Safety Guardrails

- Socket identity is bound to authenticated session token.
- Admin-only checks for start, pause, set-player, sold, and skip actions.
- Manager-only checks for bidding and opt-out actions.
- Anti-spoof bid identity validation.
- Strict bid increment rules (`+10` steps).
- Bid cooldown to reduce spam.
- Race-safe bid updates with atomic room-state filtering.
- Sold-player and duplicate-ownership protections.

### Player and Dashboard Experience

- Player catalog API with active edition support (example: `fc24`, `fc26`).
- Player explorer improvements:
  - debounced search
  - clearer filtering flow
  - improved client-side pagination
  - better result count visibility
- SweetAlert2-based alert and confirmation UX.
- Manager dashboard for budget and purchased players grouped by room.
- Room access overview on dashboard with clear join/no-access status.
- Room-specific lineup builder and achievements view.
- Admin roster management with destructive-action confirmations.

### Tournament Management

- Admin-managed tournament module (create, update, delete).
- Tournament fixtures and points table customization from admin panel.
- Team-name based generator for random fixtures.
- Public tournaments page reads live MongoDB tournament data.
- Seed tournament data is used only as fallback when DB has no tournaments.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- NextAuth v5 (credentials provider)
- MongoDB Node driver
- Socket.IO
- SweetAlert2
- Tailwind CSS v4
- TypeScript + Zod

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Environment Variables

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=replace-with-a-long-random-string
```

Variable notes:

- `MONGODB_URI`: required by app runtime and scripts.
- `NEXT_PUBLIC_APP_URL`: used for Socket.IO client/server CORS.
- `AUTH_SECRET`: required for stable NextAuth JWT encryption/signing.

### 3. Run the App

```bash
npm run dev
```

The app uses a custom server (`server.mjs`) to run Next.js and Socket.IO together on port `3000`.

## Player Data Setup

### Import Players

```bash
npm run import:players -- public/fifa24-player-list.json fc24
```

Or:

```bash
npm run import:players -- public/fc26-player-list-with-base-price.json fc26
```

This import script upserts into `players` and also sets `settings.activePlayerEdition`.

### Set Active Player Edition

```bash
npm run players:version -- fc24
```

## First Admin Setup

Public registration creates users with the `manager` role.

To access `/admin`, promote a user manually in MongoDB:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Scripts

- `npm run dev`: start development server (`server.mjs`).
- `npm run build`: build production assets.
- `npm run start`: start production server (`server.mjs`).
- `npm run lint`: run ESLint.
- `npm run import:players -- <file> <edition>`: import/upsert players.
- `npm run players:version -- <edition>`: set active player edition.

## Routes

### Pages

- `/`: landing page.
- `/players`: player catalog.
- `/tournaments`: tournament listing.
- `/register`: registration page.
- `/login`: login page.
- `/dashboard`: manager dashboard (auth required).
- `/admin`: admin panel (admin only).
- `/auction/[roomId]`: live auction room (auth required).

### API Endpoints

- `POST /api/auth/register`: register manager account.
- `GET /api/players`: list players (supports `edition`, `search`).
- `GET /api/players/version`: get active edition and available editions.
- `POST /api/players/version`: set active edition (admin only).
- `GET /api/dashboard`: manager dashboard stats (auth required).
- `GET /api/dashboard/lineup`: get manager lineup for a room.
- `PUT /api/dashboard/lineup`: save manager lineup.
- `GET /api/dashboard/achievements`: get manager achievements.
- `GET /api/auction/rooms`: list auction rooms.
- `POST /api/auction/rooms`: create auction room (admin only).
- `DELETE /api/auction/rooms`: delete auction room and related room data (admin only).
- `GET /api/auction/room/:roomId/state`: room snapshot and recent bids.
- `GET /api/auction/room/:roomId/manager-state`: manager budget/slot state and recent audit entries.
- `GET /api/admin`: admin-protected test endpoint.
- `GET /api/admin/room-access`: list manager room permissions for a room.
- `POST /api/admin/room-access`: grant/revoke manager room access, plus bulk grant-all/revoke-all.
- `GET /api/admin/achievements`: admin achievement history view.
- `POST /api/admin/achievements`: award tournament badge.
- `DELETE /api/admin/achievements`: revoke tournament badge.
- `GET /api/admin/tournaments`: list admin-managed tournaments.
- `POST /api/admin/tournaments`: create tournament.
- `PATCH /api/admin/tournaments`: update tournament.
- `DELETE /api/admin/tournaments`: delete tournament.

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

- Middleware protects `/dashboard`, `/admin`, and `/auction/*`.
- Socket connections are validated against authenticated session token before realtime actions.
- Realtime admin actions are enforced server-side (not only in UI).
- Bid constraints are validated server-side (increment, budget/squad limits, cooldown, race safety).
- Room access checks are enforced in page guard, APIs, room list queries, and socket room join.
- Tournament standings/fixtures are maintained through admin panel tournament management.
- App DB name is `fc26-auction` (set in code).
- Default round timer is `120` seconds.
