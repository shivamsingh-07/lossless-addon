/** Node.js entry point: `node dist/adapters/node.js`. Reads ./.env, listens on PORT, shuts down on SIGTERM. */
import "./load-env.js";
import { createApp, type App } from "../app.js";
import { loggerFromEnv } from "../logger.js";
import { createNodeServer } from "./node-server.js";

const logger = loggerFromEnv(process.env);
const SHUTDOWN_GRACE_MS = 10_000;

let app: App;
let port: number;
try {
  app = createApp(process.env, { logger });
  port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be an integer from 1 to 65535");
} catch (error) {
  logger.error("invalid configuration", error);
  process.exit(1);
}
const host = process.env.HOST ?? "0.0.0.0";
const server = createNodeServer(app);

let stopping = false;
function shutdown(signal: string): void {
  if (stopping) return;
  stopping = true;
  logger.info(`shutting down (${signal})`);
  setTimeout(() => {
    logger.error("shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_GRACE_MS).unref();
  server.close((error) => {
    if (error) logger.error("error while closing the server", error);
    else logger.info("stopped");
    process.exit(error ? 1 : 0);
  });
  server.closeIdleConnections();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (error) => {
  logger.error("uncaught exception", error);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled rejection", reason);
  process.exit(1);
});
server.on("error", (error: NodeJS.ErrnoException) => {
  logger.error(error.code === "EADDRINUSE" ? `port ${port} is already in use` : "server error", error);
  process.exit(1);
});

server.listen(port, host, () => {
  logger.info(`listening on ${host}:${port} (provider: ${app.config.provider})`);
});
