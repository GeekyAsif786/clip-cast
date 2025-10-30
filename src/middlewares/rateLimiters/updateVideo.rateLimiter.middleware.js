import rateLimit from "express-rate-limit";

export const videoUpdateRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: "Too many video updates. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})