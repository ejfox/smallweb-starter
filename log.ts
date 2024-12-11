export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

// Get the directory name for the job label
const JOB_LABEL =
  new URL(".", import.meta.url).pathname.split("/").filter(Boolean).pop() ||
  "smallweb-logs";

// Loki server URL
const LOKI_URL = "https://loki.tools.ejfox.com/loki/api/v1/push";

// Function to send logs to Loki
export async function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
) {
  const timestamp = BigInt(Date.now()) * 1000000n; // Current time in nanoseconds

  const logEntry = {
    streams: [
      {
        stream: { job: JOB_LABEL, level },
        values: [[timestamp.toString(), JSON.stringify({ message, meta })]],
      },
    ],
  };

  try {
    const res = await fetch(LOKI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logEntry),
    });

    if (!res.ok) {
      console.error(`Failed to send log to Loki: ${res.statusText}`);
    }
  } catch (error) {
    console.error("Error sending log to Loki:", error);
  }
}
