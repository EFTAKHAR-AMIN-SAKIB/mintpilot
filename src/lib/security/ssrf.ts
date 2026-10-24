import dns from "dns/promises";
import net from "net";

/**
 * Anti-SSRF Protection for URL fetching
 * Blocks internal networks, private IPs, loopback, cloud metadata endpoints,
 * and handles DNS rebinding prevention.
 */

// Disallowed IP ranges (private, loopback, link-local, carrier-grade, cloud metadata)
const DISALLOWED_IPV4_RANGES = [
  { start: "0.0.0.0", end: "0.255.255.255" },         // "This" network
  { start: "10.0.0.0", end: "10.255.255.255" },       // Private Class A
  { start: "100.64.0.0", end: "100.127.255.255" },   // Carrier-grade NAT
  { start: "127.0.0.0", end: "127.255.255.255" },     // Loopback
  { start: "169.254.0.0", end: "169.254.255.255" },   // Link-local / Cloud metadata (AWS, GCP, Azure)
  { start: "172.16.0.0", end: "172.31.255.255" },     // Private Class B
  { start: "192.0.0.0", end: "192.0.0.255" },         // IETF Protocol Assignments
  { start: "192.168.0.0", end: "192.168.255.255" },   // Private Class C
  { start: "198.18.0.0", end: "198.19.255.255" },     // Benchmark testing
  { start: "224.0.0.0", end: "239.255.255.255" },     // Multicast
  { start: "240.0.0.0", end: "255.255.255.255" },     // Reserved
];

function ipToLong(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function isPrivateOrReservedIPv4(ip: string): boolean {
  if (!net.isIPv4(ip)) return false;
  const ipLong = ipToLong(ip);
  return DISALLOWED_IPV4_RANGES.some((range) => {
    const startLong = ipToLong(range.start);
    const endLong = ipToLong(range.end);
    return ipLong >= startLong && ipLong <= endLong;
  });
}

export function isPrivateOrReservedIPv6(ip: string): boolean {
  if (!net.isIPv6(ip)) return false;
  const lower = ip.toLowerCase();
  // Loopback (::1)
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
  // Unspecified (::)
  if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
  // Link-local (fe80::/10)
  if (lower.startsWith("fe80:") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
  // Unique local (fc00::/7)
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  // IPv4-mapped IPv6 (::ffff:0:0/96)
  if (lower.startsWith("::ffff:")) {
    const ipv4Part = lower.replace("::ffff:", "");
    if (net.isIPv4(ipv4Part)) {
      return isPrivateOrReservedIPv4(ipv4Part);
    }
  }
  return false;
}

export function isDisallowedIp(ip: string): boolean {
  return isPrivateOrReservedIPv4(ip) || isPrivateOrReservedIPv6(ip);
}

export interface SafeFetchOptions {
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
}

export async function validateUrlSafety(targetUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Enforce http or https only
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}. Only http: and https: are allowed.`);
  }

  // Disallow user credentials in URL
  if (parsed.username || parsed.password) {
    throw new Error("URLs with user credentials are not allowed");
  }

  const hostname = parsed.hostname;

  // Direct IP address check
  if (net.isIP(hostname)) {
    if (isDisallowedIp(hostname)) {
      throw new Error(`Target IP address ${hostname} is private, internal, or reserved`);
    }
  } else {
    // DNS resolution check to prevent DNS rebinding or internal domain access (e.g., localhost, internal.corp)
    if (hostname.toLowerCase() === "localhost" || hostname.toLowerCase().endsWith(".localhost") || hostname.toLowerCase().endsWith(".local")) {
      throw new Error("Localhost and local domains are prohibited");
    }

    try {
      const addresses = await dns.lookup(hostname, { all: true });
      if (!addresses || addresses.length === 0) {
        throw new Error(`Could not resolve hostname: ${hostname}`);
      }

      for (const addr of addresses) {
        if (isDisallowedIp(addr.address)) {
          throw new Error(`Hostname ${hostname} resolves to prohibited address: ${addr.address}`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("prohibited")) {
        throw err;
      }
      throw new Error(`DNS resolution failed for ${hostname}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return parsed;
}

/**
 * Fetch a webpage safely with anti-SSRF protections, byte limits, and redirect validation.
 */
export async function safeFetchUrl(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<{ content: string; contentType: string; finalUrl: string }> {
  const maxBytes = options.maxBytes ?? 512 * 1024; // 512 KB
  const timeoutMs = options.timeoutMs ?? 5000;     // 5 seconds
  const maxRedirects = options.maxRedirects ?? 3;

  let currentUrl = targetUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const validated = await validateUrlSafety(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(validated.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent": "MintPilot-SafeResolver/1.0 (+https://mintpilot.local)",
          "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5",
        },
        redirect: "manual", // Manually handle redirects so each hop is re-validated against SSRF
      });

      clearTimeout(timeout);

      // Handle redirect
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          throw new Error("Too many redirects encountered while resolving URL");
        }
        const location = response.headers.get("location");
        if (!location) {
          throw new Error(`Redirect ${response.status} missing Location header`);
        }
        // Resolve relative redirects against current URL
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} ${response.statusText} fetching URL`);
      }

      const contentType = response.headers.get("content-type") || "text/html";
      
      // Enforce content size limit safely
      const reader = response.body?.getReader();
      if (!reader) {
        const text = await response.text();
        return { content: text.slice(0, maxBytes), contentType, finalUrl: currentUrl };
      }

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > maxBytes) {
            chunks.push(value.slice(0, maxBytes - (totalBytes - value.length)));
            break;
          }
          chunks.push(value);
        }
      }

      const decoder = new TextDecoder("utf-8");
      const fullBuffer = Buffer.concat(chunks);
      const content = decoder.decode(fullBuffer);

      return { content, contentType, finalUrl: currentUrl };
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  throw new Error("Exceeded redirect limit");
}
