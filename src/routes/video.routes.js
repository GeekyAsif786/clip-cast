import { Router } from 'express';
import {deleteVideo, getAllVideos, getVideoById, getVideoBySearch, publishAVideo, togglePublishStatus, updateVideo} from "../controllers/video.controllers.js"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import { publishVideoRateLimiter } from '../middlewares/rateLimiters/publishVideo.rateLimiter.middleware.js';
import { dynamicActionRateLimiter } from '../middlewares/rateLimiters/dynamicActionRateLimiter.js';
import { togglePublishRateLimiter } from '../middlewares/rateLimiters/togglePublish.rateLimiter.middleware.js';
import { videoUpdateRateLimiter } from '../middlewares/rateLimiters/updateVideo.rateLimiter.middleware.js';

const router = Router();
router.use(verifyJwt);

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
router.route("/:videoId").patch(videoUpdateRateLimiter,upload.single("thumbnail"), updateVideo).delete(deleteVideo);
router.route("/toggle/publish/:videoId").patch(togglePublishRateLimiter,togglePublishStatus);
export default router;