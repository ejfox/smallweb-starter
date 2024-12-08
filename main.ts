// main.ts: Smallweb Starter
// ================================================
// Features:
// - Basic API example with Supabase integration
// - Built-in caching and rate-limiting
// - Lightweight and ready-to-clone
// ================================================

// Import Supabase client
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Initialize Supabase client
const supabase = (() => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_KEY = Deno.env.get("SUPABASE_KEY");
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY);
})();

// In-memory rate-limiting (per IP)
const rateLimitMap = new Map<string, number[]>();

export default {
  async fetch(req: Request): Promise<Response> {
    const headers = new Headers();

    // Get client IP from Cloudflare headers
    const clientIp = req.headers.get("cf-connecting-ip") || "unknown";

    // Rate-limiting: Allow 60 requests per minute
    const now = Date.now();
    const requests = rateLimitMap.get(clientIp) || [];
    const recentRequests = requests.filter((timestamp) => now - timestamp < 60000);
    if (recentRequests.length >= 60) {
      headers.set("Retry-After", "60");
      return new Response("Rate limit exceeded", { status: 429, headers });
    }
    rateLimitMap.set(clientIp, [...recentRequests, now]);

    // Set caching headers
    headers.set("Cache-Control", "public, max-age=10, s-maxage=30, must-revalidate");

    // Example Supabase query
    const { data, error } = await supabase.from("example_table").select("*");
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Response with data
    return new Response(
      JSON.stringify({
        message: "Hello, Smallweb!",
        data,
      }),
      { headers }
    );
  },
};
