/**
 * One JSON object per line: {"time", "severity", "msg"} plus "err" (the error
 * message) when there is one. INFO goes to console.log, WARN to console.warn and
 * ERROR to console.error, which is stdout/stderr on Node and the log stream on
 * Cloudflare Workers.
 *
 * Messages must never contain search text or stream URLs.
 */

const LEVELS = { info: 20, warn: 30, error: 40, off: 100 } as const;
type LogLevel = keyof typeof LEVELS;
type Severity = "INFO" | "WARN" | "ERROR";

export interface Logger {
  info(msg: string): void;
  warn(msg: string, err?: unknown): void;
  error(msg: string, err?: unknown): void;
}

export interface LoggerOptions {
  level?: LogLevel;
  write?: (line: string, severity: Severity) => void;
  now?: () => Date;
}

const clip = (value: string, max = 500): string => (value.length > max ? `${value.slice(0, max)}…` : value);
const errorText = (err: unknown): string => clip(err instanceof Error ? err.message : String(err));

const defaultWrite = (line: string, severity: Severity): void => {
  if (severity === "INFO") console.log(line);
  else if (severity === "WARN") console.warn(line);
  else console.error(line);
};

export function createLogger(options: LoggerOptions = {}): Logger {
  const threshold = LEVELS[options.level ?? "info"];
  const write = options.write ?? defaultWrite;
  const now = options.now ?? (() => new Date());

  const emit = (level: Exclude<LogLevel, "off">, severity: Severity, msg: string, err?: unknown): void => {
    if (LEVELS[level] < threshold) return;
    const entry: Record<string, string> = { time: now().toISOString(), severity, msg: clip(msg) };
    if (err !== undefined) entry.err = errorText(err);
    try {
      write(JSON.stringify(entry), severity);
    } catch {
      // Logging must never take the process down.
    }
  };

  return {
    info: (msg) => emit("info", "INFO", msg),
    warn: (msg, err) => emit("warn", "WARN", msg, err),
    error: (msg, err) => emit("error", "ERROR", msg, err),
  };
}

/** A logger whose level comes from LOG_LEVEL (info | warn | error | off, default info). */
export function loggerFromEnv(env: Readonly<Record<string, unknown>>): Logger {
  const raw = typeof env.LOG_LEVEL === "string" ? env.LOG_LEVEL.trim().toLowerCase() : "";
  const known = Object.hasOwn(LEVELS, raw);
  const logger = createLogger({ level: known ? (raw as LogLevel) : "info" });
  if (raw && !known) logger.warn(`ignoring unknown LOG_LEVEL "${clip(raw, 30)}" (use info, warn, error or off)`);
  return logger;
}
