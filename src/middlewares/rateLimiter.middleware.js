import rateLimit from "express-rate-limit";

// 🧠 Rate limiter for updating tweets (per-user, not per-IP)
export const updateTweetRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // max 5 updates per user per minute
  keyGenerator: (req) => req.user?._id?.toString() || req.ip, // fallback to IP if user not logged in
  message: "Too many tweet updates. Please try again later.",
  standardHeaders: true, // adds RateLimit-* headers for better client UX
  legacyHeaders: false,  // disables deprecated X-RateLimit-* headers
});
