/**
 * Minimal structured logger.
 *
 * Rules (docs/ARCHITECTURE.md):
 * - Never log passwords, tokens, cookies, payment payloads, message content or
 *   sensitive profile text.
 * - Log event names + safe metadata only.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

const SENSITIVE_KEY =
  /pass(word)?|secret|token|authorization|cookie|api[-_]?key|card|cvv|body|content|email|phone|message|birth/i;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL?.toLowerCase();
  return configured === "debug" || configured === "warn" || configured === "error"
    ? configured
    : "info";
}

/** Replaces values under sensitive keys and redacts obvious secrets in strings. */
export function redact(fields: LogFields): LogFields {
  const output: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (SENSITIVE_KEY.test(key)) {
      output[key] = "[redacted]";
    } else if (typeof value === "string") {
      output[key] = value
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[redacted-email]")
        .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]");
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = redact(value as LogFields);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function write(level: LogLevel, event: string, fields: LogFields = {}): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[currentLevel()]) return;

  const entry = {
    level,
    event,
    time: new Date().toISOString(),
    ...redact(fields),
  };

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, fields?: LogFields) => write("debug", event, fields),
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
