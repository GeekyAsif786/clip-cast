import rateLimit from "express-rate-limit";

export const toggleSubscriptionRateLimiter = rateLimit({
    windowMs: 10*1000,
    max: 3,
    message: "Too many subscription actions, try again later",
    keyGenerator:(req) => req.user?._id?.toString() || req.ip,
    standardHeaders: true,
    legacyHeaders:false,
})