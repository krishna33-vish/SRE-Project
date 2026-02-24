import express from "express";
import health from "./routes/health";
import ready from "./routes/ready";
import metrics, { httpRequestDuration } from "./routes/metrics";
import { failureMiddleware } from "./middleware/failureMiddleware";
import { logger } from "./logger";

export const app = express();

app.use(express.json());
app.use(failureMiddleware);

app.use("/health", health);
app.use("/ready", ready);
app.use("/metrics", metrics);

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({
    method: req.method,
    route: req.path
  });

  res.on("finish", () => {
    end({ status: res.statusCode.toString() });
  });

  logger.info({
    method: req.method,
    path: req.path,
    status: res.statusCode
  });

  next();
});