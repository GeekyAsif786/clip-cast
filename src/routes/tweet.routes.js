import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { updateTweetRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

//public API endpoint
router.route("/user/:userId").get(getUserTweets);

// Auth-protected routes
router.use(verifyJWT);
router.post("/", createTweet);
router.patch("/:tweetId", updateTweetRateLimiter, updateTweet);
router.delete("/:tweetId", deleteTweet);

export default router