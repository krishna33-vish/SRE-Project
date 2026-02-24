import { Router } from "express";
import { config } from "../config";

const router = Router();

router.get("/", (_req, res) => {
  if (config.forceUnready) {
    return res.status(503).json({ status: "not ready" });
  }

  res.status(200).json({ status: "ready" });
});

export default router;