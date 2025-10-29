//Dynamic- changes Limits as per roles nad and action

import rateLimit from "express-rate-limit";
import { RATE_LIMITS } from "../../config/rateLimits.js";

const limiterCache = {};

export const dynamicActionRateLimiter = (actionType) => {
  if (!limiterCache[actionType]) {
    const config = RATE_LIMITS[actionType] || RATE_LIMITS.publishAVideo;
    limiterCache[actionType] = {
      normal: rateLimit({
        windowMs: config.window,
        max: config.normal,
        keyGenerator: (req) => req.user?._id?.toString() || req.ip,
        message: "Too many requests. Please slow down.",
        standardHeaders: true,
        legacyHeaders: false,
      }),
      premium: rateLimit({
        windowMs: config.window,
        max: config.premium,
        keyGenerator: (req) => req.user?._id?.toString() || req.ip,
        message: "Too many requests. Please slow down.",
        standardHeaders: true,
        legacyHeaders: false,
      }), 
    };
  }

  return (req, res, next) => {
    const user = req?.user || "normal";
    const isPremium = user?.role === "premium";
    const isAdmin = user?.role === "admin";
    if (isAdmin) return next();
    const limiter = isPremium
      ? limiterCache[actionType].premium
      : limiterCache[actionType].normal;
    return limiter(req, res, next);
  };
};