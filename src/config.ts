export const config = {
  port: process.env.PORT || 3000,
  failureRate: Number(process.env.FAILURE_RATE || 0),
  slowResponseMs: Number(process.env.SLOW_RESPONSE_MS || 0),
  forceUnready: process.env.FORCE_UNREADY === "true"
};