import { Request, Response, NextFunction } from "express";
import { config } from "../config";

export const failureMiddleware = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (config.slowResponseMs > 0) {
    await new Promise(resolve => setTimeout(resolve, config.slowResponseMs));
  }

  if (Math.random() < config.failureRate) {
    return res.status(500).json({ error: "Simulated random failure" });
  }

  next();
};