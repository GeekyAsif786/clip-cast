import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const createTweetRateLimiter = rateLimit({
    windowMs:60*1000,
    max:5,
    message: "Too many tweet creation, slow down!",
    keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
    standardHeaders:true,
    legacyHeader:false,
})