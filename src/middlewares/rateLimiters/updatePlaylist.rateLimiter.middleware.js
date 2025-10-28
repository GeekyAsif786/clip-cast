import rateLimit from "express-rate-limit";

export const updatePlaylistRateLimiter =  rateLimit({
    windowMs: 60*1000,
    max: 5,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    message: "Too many playlist updates. Please wait a minute and try again.",
    standardHeaders: true,
    legacyHeaders: false,
})

