// main.ts: Smallweb Starter
// ================================================
// A minimal API template with:
// - Structured logging via Loki
// - Basic rate limiting (60 req/min)
// - Error handling & Supabase integration
// ================================================

import { log, LogLevel } from "./log.ts";
import { getLatestScraps } from "./supabase.ts";
import {
  getRequestContext,
  checkRateLimit,
  setCommonHeaders,
  getRateLimitResponse,
  getErrorResponse,
} from "./middleware.ts";

// ================================================
// API Handler - Add your routes below
// ================================================

export default {
  async fetch(req: Request): Promise<Response> {
    const { url, headers, clientIp } = getRequestContext(req);

    // Log incoming request
    log(LogLevel.INFO, "Incoming request", {
      path: url.pathname,
      method: req.method,
      clientIp,
    });

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return getRateLimitResponse(headers);
    }

    try {
      setCommonHeaders(headers);

      // Example route - replace with your own
      if (url.pathname === "/api/scraps") {
        const data = await getLatestScraps();
        return new Response(JSON.stringify({ data }), { headers });
      }

      // Default response
      return new Response(
        JSON.stringify({
          message: "Hello, Smallweb!",
          endpoints: ["/api/scraps"],
        }),
        { headers }
      );
    } catch (error) {
      return getErrorResponse(error, headers);
    }
  },
};
