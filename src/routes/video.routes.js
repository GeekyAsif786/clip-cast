import { Router } from 'express';
import {deleteVideo, getAllVideos, getVideoById, getVideoBySearch, publishAVideo, togglePublishStatus, updateVideo} from "../controllers/video.controllers.js"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import { publishVideoRateLimiter } from '../middlewares/rateLimiters/publishVideo.rateLimiter.middleware.js';
import { dynamicActionRateLimiter } from '../middlewares/rateLimiters/dynamicActionRateLimiter.js';

const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name:"videoFile",
                maxCount:1,
            },
            {
                name:"thumbnail",
                maxCount:1,
            },
        ]),dynamicActionRateLimiter("publishAVideo"),
        publishAVideo
    );

router.route("/id/:videoId").get(getVideoById);
router.route("/search").get(getVideoBySearch);
router.route("/:videoId").patch(upload.single("thumbnail"), updateVideo).delete(deleteVideo);
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
export default router;