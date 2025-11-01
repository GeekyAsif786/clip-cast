import rateLimit, { ipKeyGenerator } from "express-rate-limit";

//Rate limiter for updating tweets (per-user, not per-IP)
export const updateTweetRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
  message: "Too many tweet updates. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
