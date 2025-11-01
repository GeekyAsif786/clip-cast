import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const videoUpdateRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
  message: "Too many video updates. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})