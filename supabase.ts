import { createClient } from "@supabase/supabase-js";
import { log, LogLevel } from "./log.ts";

// Initialize Supabase client
export const supabase = (() => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log(LogLevel.ERROR, "Missing Supabase environment variables");
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY);
})();

// Example query - replace with your own
export async function getLatestScraps() {
  const { data, error } = await supabase.from("scraps").select("*").limit(10);

  if (error) {
    log(LogLevel.ERROR, "Supabase query failed", { error: error.message });
    throw error;
  }

  return data;
}
