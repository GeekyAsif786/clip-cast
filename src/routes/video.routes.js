import { Router } from 'express';
import {getAllVideos, getVideoById, getVideoBySearch, publishAVideo} from "../controllers/video.controllers.js"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

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
        ]),
        publishAVideo
    );

router.route("/id/:videoId").get(getVideoById);
router.route("/search").get(getVideoBySearch);

export default router;