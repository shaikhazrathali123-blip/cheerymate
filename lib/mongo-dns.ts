import dns from "node:dns";

/**
 * `mongodb+srv://` URIs need DNS SRV/TXT lookups. Some networks (mobile hotspots, some ISPs/routers)
 * answer those with EBADRESP / ECONNREFUSED / ETIMEOUT. We then retry using public resolvers.
 * Override with MONGODB_DNS_SERVERS="8.8.8.8,1.1.1.1" (applied up front when set).
 */
const FALLBACK = ["8.8.8.8", "1.1.1.1"];

export function applyConfiguredDns() {
  const custom = process.env.MONGODB_DNS_SERVERS?.split(",").map((s) => s.trim()).filter(Boolean);
  if (custom?.length) dns.setServers(custom);
}

export function isSrvDnsError(e: unknown) {
  const err = e as { syscall?: string; code?: string; message?: string };
  return (
    (err?.syscall === "querySrv" || err?.syscall === "queryTxt" || /querySrv|queryTxt/.test(err?.message ?? "")) &&
    ["EBADRESP", "ECONNREFUSED", "ETIMEOUT", "ESERVFAIL", "ENOTFOUND", "EREFUSED"].includes(err?.code ?? "")
  );
}

/** Runs `connect`; if the SRV lookup fails on this network, switches to public DNS and retries once. */
export async function withSrvDnsFallback<T>(connect: () => Promise<T>): Promise<T> {
  applyConfiguredDns();
  try {
    return await connect();
  } catch (e) {
    if (!isSrvDnsError(e)) throw e;
    console.warn(`[db] DNS SRV lookup failed (${(e as { code?: string }).code}) — retrying with public DNS ${FALLBACK.join(", ")}`);
    dns.setServers(FALLBACK);
    return connect();
  }
}
