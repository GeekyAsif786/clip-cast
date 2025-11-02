import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const RATE_LIMITS_VIDEO = {
  publishAVideo: { normal: 3, premium: 10, window: 10 * 60 * 1000 },
  createTweet: { normal: 5, premium: 15, window: 5 * 60 * 1000 },
  toggleLike: { normal: 30, premium: 60, window: 1 * 60 * 1000 },
  comment: { normal: 10, premium: 30, window: 2 * 60 * 1000 },
};

export const RATE_LIMITS_AUTH = {
    loginUser: {window: 15 * 60 * 1000, max: 10, key: (req) => ipKeyGenerator(req), message: "Too many login attempts, try after 15 minutes", },
    registerUser: {window: 15 * 60 * 1000, max: 5, key: (req) => ipKeyGenerator(req), message: "Too many attempts, kindly slow down"},
    changeCurrentPassword: {window: 60 * 60 * 1000, max: 3, key: (req) => req.user?._id?.toString(), message: "Too many attempts, try after 1 hour"},
    updateAccountDetails: {window: 10 * 60 * 1000, max: 10, key: (req) => req.user?._id?.toString(), message: "Too many update attempts, try again after 10 minutes"},
    updateUserAvatar: {window: 60 * 60 * 1000, max: 3, key: (req) => req.user?._id?.toString(), message: "Too many update attempts, try again after 10 minutes"},
    updateUserCoverImage: {window: 60 * 60 * 1000, max: 3, key: (req) => req.user?._id?.toString(), message: "Too many update attempts, try again after 10 minutes"}
}

