import { Router } from 'express';
import {verifyJwt} from "../middlewares/auth.middleware.js"
import { 
    getLikedVideos,
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    } from '../controllers/like.controllers.js'; 
import { toggleLikeRateLimiter } from '../middlewares/rateLimiters/like.rateLimiter.middleware.js';

const router = Router();
router.use(verifyJwt);

router.route("/toggle/v/:videoId").post(toggleLikeRateLimiter,toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleLikeRateLimiter,toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleLikeRateLimiter,toggleTweetLike);
router.route("/getlikedvideos").get(getLikedVideos);

export default router;