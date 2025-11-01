import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const updatePlaylistRateLimiter =  rateLimit({
    windowMs: 60*1000,
    max: 5,
    keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
    message: "Too many playlist updates. Please wait a minute and try again.",
    standardHeaders: true,
    legacyHeaders: false,
})

