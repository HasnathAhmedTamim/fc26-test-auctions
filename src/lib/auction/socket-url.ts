/**
 * Socket.IO must hit the same host that runs `server/index.mjs` (not Vercel serverless).
 * In the browser we prefer the current origin so production works without rebuilding
 * when the public URL changes (Render/Railway custom domains).
 */
export function getSocketServerUrl(): string {
  if (typeof window !== "undefined") {
    const configured = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
    if (configured) return configured.replace(/\/$/, "");
    return window.location.origin;
  }

  const configured =
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    process.env.RAILWAY_STATIC_URL?.trim();

  return (configured || "http://localhost:3000").replace(/\/$/, "");
}
