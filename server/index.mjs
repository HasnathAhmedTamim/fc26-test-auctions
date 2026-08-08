import dotenv from "dotenv";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { fetchAuctionRuntimeSettings } from "../src/lib/auction/runtime-settings.mjs";
import { connectDb } from "./lib/db.mjs";
import { createSocketAuthMiddleware } from "./socket/auth.mjs";
import { createRoomRuntime } from "./socket/room-runtime.mjs";
import { registerAuctionHandlers } from "./socket/handlers.mjs";

dotenv.config({ path: ".env.local" });

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing in .env.local");
}

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(async () => {
  const { db } = await connectDb(mongoUri);
  const runtimeSettingsCache = { value: null, fetchedAt: 0 };

  async function getAuctionSettings() {
    return fetchAuctionRuntimeSettings(db, runtimeSettingsCache);
  }

  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  const runtime = createRoomRuntime({ db, io, getAuctionSettings });

  io.use(createSocketAuthMiddleware());
  registerAuctionHandlers(io, { db, getAuctionSettings, runtime });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
