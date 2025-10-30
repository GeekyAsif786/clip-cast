import rateLimit from "express-rate-limit";

export const togglePublishRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 10, 
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: "Too many publish toggles. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})