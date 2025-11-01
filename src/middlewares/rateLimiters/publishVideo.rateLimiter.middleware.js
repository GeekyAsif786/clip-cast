import rateLimit, { ipKeyGenerator } from "express-rate-limit";


export const publishVideoRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,                   // max 3 uploads per user per 10 minutes
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
  message: "Upload limit reached. Please wait a few minutes before publishing another video.",
  standardHeaders: true,
  legacyHeaders: false,
});


