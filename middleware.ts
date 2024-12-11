import { log, LogLevel } from "./log.ts";

// In-memory rate-limiting (per IP)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 60; // requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

export interface RequestContext {
  url: URL;
  headers: Headers;
  clientIp: string;
  method: string;
}

// Get request context from incoming request
export function getRequestContext(req: Request): RequestContext {
  const url = new URL(req.url);
  const headers = new Headers({
    "content-type": "application/json",
  });

  return {
    url,
    headers,
    method: req.method,
    clientIp:
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      "unknown",
  };
}

// Check rate limit for client IP
export function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(clientIp) || [];
  const recentRequests = requests.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  if (recentRequests.length >= RATE_LIMIT) {
    log(LogLevel.WARN, "Rate limit exceeded", { clientIp });
    return false;
  }

  rateLimitMap.set(clientIp, [...recentRequests, now]);
  return true;
}

// Set common response headers
export function setCommonHeaders(headers: Headers): Headers {
  headers.set(
    "Cache-Control",
    "public, max-age=10, s-maxage=30, must-revalidate"
  );
  return headers;
}

// Create rate limit exceeded response
export function getRateLimitResponse(headers: Headers): Response {
  headers.set("Retry-After", "60");
  return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
    status: 429,
    headers,
  });
}

// Create error response
export function getErrorResponse(error: unknown, headers: Headers): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);

  log(LogLevel.ERROR, "Request failed", {
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message:
        Deno.env.get("DENO_ENV") === "development" ? errorMessage : undefined,
    }),
    {
      status: 500,
      headers,
    }
  );
}
