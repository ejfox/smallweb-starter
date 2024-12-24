// main.ts: Smallweb Starter
// ================================================
// A minimal API template with:
// - Structured logging via Loki
// - Basic rate limiting (60 req/min)
// - Error handling & Supabase integration
// ================================================

import { Hono } from "jsr:@hono/hono";
import { log, LogLevel } from "./log.ts";
import { getLatestScraps } from "./supabase.ts";
import {
  getRequestContext,
  checkRateLimit,
  setCommonHeaders,
  getRateLimitResponse,
  getErrorResponse,
} from "./middleware.ts";

// Create Hono app
const app = new Hono();

// Middleware to handle rate limiting and common headers
app.use("*", async (c, next) => {
  const { clientIp } = getRequestContext(c.req.raw);

  log(LogLevel.INFO, "Incoming request", {
    path: c.req.path,
    method: c.req.method,
    clientIp,
  });

  if (!checkRateLimit(clientIp)) {
    return getRateLimitResponse(c.res.headers);
  }

  setCommonHeaders(c.res.headers);
  await next();
});

// Routes
app.get("/", (c) => {
  return c.json({
    message: "Hello, Smallweb!",
    endpoints: ["/api/scraps"],
  });
});

app.get("/api/scraps", async (c) => {
  try {
    const data = await getLatestScraps();
    return c.json({ data });
  } catch (error) {
    // Convert the error response to Hono response
    const errorResp = getErrorResponse(error, c.res.headers);
    return c.json(await errorResp.json(), errorResp.status);
  }
});

// Export the fetch handler
export default {
  fetch: app.fetch,
};
