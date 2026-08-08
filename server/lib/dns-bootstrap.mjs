import dns from "node:dns";

/**
 * Some local DNS resolvers (common on Windows routers) refuse SRV lookups that
 * mongodb+srv URIs require, while nslookup still works. Optional fallback DNS.
 */
export function configureMongoDns() {
  const servers = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (servers?.length) {
    dns.setServers(servers);
  }
}
