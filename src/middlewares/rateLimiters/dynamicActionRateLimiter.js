//Dynamic- changes Limits as per roles nad and action

import rateLimit from "express-rate-limit";
import { RATE_LIMITS } from "../../config/rateLimits.js";

export const dynamicActionRateLimiter = (actionType) => (req, res, next) => {
  const user = req.user || {};

  const config = RATE_LIMITS[actionType] || RATE_LIMITS.publishAVideo;
  const isPremium = user?.role === "premium";
  const isAdmin = user?.role === "admin";
  if(isAdmin) return next(); //admin skips limiter

  const limiter = rateLimit({
    windowMs: config.window,
    max: isPremium ? config.premium : config.normal,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    message: "Too many requests. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  return limiter(req, res, next);
};