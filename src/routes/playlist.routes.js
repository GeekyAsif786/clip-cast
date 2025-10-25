router.patch("/:playlistId/visibility", verifyJWT, togglePlaylistVisibility);
