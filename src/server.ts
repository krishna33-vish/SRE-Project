import { app } from "./app";
import { config } from "./config";
import { logger } from "./logger";

const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down...");
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});