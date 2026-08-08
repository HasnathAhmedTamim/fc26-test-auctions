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

dotenv.config({ path: ".env.local" });
dotenv.config();

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
// Do not use process.env.HOSTNAME — Render/Linux containers set it to the pod name,
// which breaks load balancer routing (502). Always bind all interfaces in production.
const bindHost = process.env.BIND_HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 3000;
const appUrl = resolveAppUrl();
const mongoUri = process.env.MONGODB_URI;

const app = next({ dev });
let nextHandler = null;
let bootError = null;
let isReady = false;

function writeResponse(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

const httpServer = createServer((req, res) => {
  const path = req.url?.split("?")[0] ?? "/";

  if (path === "/health") {
    if (bootError) {
      writeResponse(res, 503, `error: ${bootError.message}`);
      return;
    }
    writeResponse(res, isReady ? 200 : 200, isReady ? "ok" : "starting");
    return;
  }

  if (bootError) {
    writeResponse(res, 503, `Server failed to start: ${bootError.message}`);
    return;
  }

  if (!isReady || !nextHandler) {
    writeResponse(res, 503, "Server is starting, please retry in a few seconds.");
    return;
  }

  nextHandler(req, res);
});

httpServer.listen(port, bindHost, () => {
  console.log(`> Listening on ${bindHost}:${port}`);
  void bootstrap();
});

async function bootstrap() {
  if (!mongoUri) {
    bootError = new Error(
      "MONGODB_URI is missing. Add it in Render → Environment (or .env.local locally)."
    );
    console.error(bootError.message);
    return;
  }

  if (!process.env.AUTH_SECRET) {
    bootError = new Error(
      "AUTH_SECRET is missing. Add it in Render → Environment (or .env.local locally)."
    );
    console.error(bootError.message);
    return;
  }

  try {
    console.log("> Preparing Next.js...");
    await app.prepare();
    nextHandler = app.getRequestHandler();

    console.log("> Connecting to MongoDB...");
    const { db } = await connectDb(mongoUri);

    const runtimeSettingsCache = { value: null, fetchedAt: 0 };

    async function getAuctionSettings() {
      return fetchAuctionRuntimeSettings(db, runtimeSettingsCache);
    }

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

    isReady = true;
    console.log(`> Ready at ${appUrl}`);
    console.log("> Socket.IO enabled for live auction.");
  } catch (error) {
    bootError = error instanceof Error ? error : new Error(String(error));
    console.error("Failed to start application:", bootError);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});
