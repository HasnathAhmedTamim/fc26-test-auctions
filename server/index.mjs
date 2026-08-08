import dotenv from "dotenv";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { fetchAuctionRuntimeSettings } from "../src/lib/auction/runtime-settings.mjs";
import { configureMongoDns } from "./lib/dns-bootstrap.mjs";
import { connectDb } from "./lib/db.mjs";
import { createSocketAuthMiddleware } from "./socket/auth.mjs";
import { createRoomRuntime } from "./socket/room-runtime.mjs";
import { registerAuctionHandlers } from "./socket/handlers.mjs";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
}

configureMongoDns();

function resolveAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.RAILWAY_STATIC_URL ||
    "http://localhost:3000"
  )
    .trim()
    .replace(/\/$/, "");
}

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT) || 3000;
const appUrl = resolveAppUrl();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing. Set it in .env.local (dev) or your host env (production).");
}

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(async () => {
  let db;
  try {
    ({ db } = await connectDb(mongoUri));
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }

  const runtimeSettingsCache = { value: null, fetchedAt: 0 };

  async function getAuctionSettings() {
    return fetchAuctionRuntimeSettings(db, runtimeSettingsCache);
  }

  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: appUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const runtime = createRoomRuntime({ db, io, getAuctionSettings });

  io.use(createSocketAuthMiddleware());
  registerAuctionHandlers(io, { db, getAuctionSettings, runtime });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on ${appUrl} (listening ${hostname}:${port})`);
    console.log(`> Socket.IO enabled — live auction requires this Node host (not Vercel-only).`);
  });
});
