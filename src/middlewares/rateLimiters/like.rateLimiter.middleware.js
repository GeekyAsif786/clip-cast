import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const toggleLikeRateLimiter = rateLimit({
  windowMs: 30 * 1000, // shorter window (30 sec)
  max: 8, // max 8 toggle actions per user per 30 seconds
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
  message: "Too many like/unlike actions. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});