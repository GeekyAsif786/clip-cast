import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    togglePlaylistVisibility,
    updatePlaylist,
} from "../controllers/playlist.controllers.js"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import { updatePlaylistRateLimiter } from '../middlewares/rateLimiters/updatePlaylist.rateLimiter.middleware.js';

const router = Router();

router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylist)

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylistRateLimiter,updatePlaylist)
    .delete(deletePlaylist);
router.route("/:playlistId/visibility").patch(verifyJwt,togglePlaylistVisibility)
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/user/:userId").get(getUserPlaylists);

export default router



