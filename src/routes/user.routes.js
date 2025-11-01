import {Router} from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";
import { dynamicActionRateLimiterVideo, dynamicActionRateLimiterAuth } from '../middlewares/rateLimiters/dynamicActionRateLimiter.js'; 

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount: 1
        },
        {
            name:"coverImage",
            maxCount: 1
        }
    ]),dynamicActionRateLimiterAuth("registerUser")
    registerUser)

router.route("/login").post(dynamicActionRateLimiterAuth("loginUser"),loginUser)

//secured routes

router.route("/logout").post(verifyJwt, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt,dynamicActionRateLimiterAuth("changeCurrentPassword"),changeCurrentPassword)
router.route("/current-user").get(verifyJwt,getCurrentUser)
router.route("/update-account").patch(verifyJwt,dynamicActionRateLimiterAuth("updateAccountDetails"),updateAccountDetails)
router.route("/avatar").patch(verifyJwt,dynamicActionRateLimiterAuth("updateUserAvatar"),upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJwt,dynamicActionRateLimiterAuth("updateUserCoverImage"),upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJwt,getUserChannelProfile)
router.route("/history").get(verifyJwt,getWatchHistory)

export default router