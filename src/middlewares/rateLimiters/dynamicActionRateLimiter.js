//Dynamic- changes Limits as per roles nad and action

import rateLimit from "express-rate-limit";
import { RATE_LIMITS_VIDEO } from "../../config/rateLimits.js";
import { RATE_LIMITS_AUTH } from "../../config/rateLimits.js";

//const limiterCache = {};
const limiterCache = Object.create(null);
//const AuthLimiterCache = {};
const AuthLimiterCache = Object.create(null);


const dynamicActionRateLimiterVideo = (actionType) => {
  if (!limiterCache[actionType]) {
    const config = RATE_LIMITS_VIDEO[actionType] || RATE_LIMITS_VIDEO.publishAVideo;
    limiterCache[actionType] = {
      normal: rateLimit({
        windowMs: config.window,
        max: config.normal,
        keyGenerator: (req) => req.user?._id?.toString() || req.ip,
        message: "Too many requests. Please slow down.",
        standardHeaders: true,
        legacyHeaders: false,
      }),
      premium: rateLimit({
        windowMs: config.window,
        max: config.premium,
        keyGenerator: (req) => req.user?._id?.toString() || req.ip,
        message: "Too many requests. Please slow down.",
        standardHeaders: true,
        legacyHeaders: false,
      }), 
    };
  }

  return (req, res, next) => {
    const user = req?.user || "normal";
    const isPremium = user?.role === "premium";
    const isAdmin = user?.role === "admin";
    if (isAdmin) return next();
    const limiter = isPremium
      ? limiterCache[actionType].premium
      : limiterCache[actionType].normal;
    return limiter(req, res, next);
  };
};


const dynamicActionRateLimiterAuth = (actionType) => {
    if(!AuthLimiterCache[actionType]){
        const config = RATE_LIMITS_AUTH[actionType] || {
            window: 15 * 60 * 1000,
            max: 10,
            key: (req) => req.ip,
            message: "Too many requests, please try again later"
        };
        AuthLimiterCache[actionType] = 
            rateLimit({
                windowMs: config.window,
                max: config.max,
                keyGenerator: config.key,
                message: config.message,
                standardHeaders: true,
                legacyHeaders: false,   
            })
    }
    return (req,res,next) => {
        const user = req?.user || "normal";
        const isAdmin = user && user.role === "admin";
        if(isAdmin) return next();
        const limiter = AuthLimiterCache[actionType];
        return limiter(req,res,next);
    };
};

export {
    dynamicActionRateLimiterAuth,
    dynamicActionRateLimiterVideo,
}