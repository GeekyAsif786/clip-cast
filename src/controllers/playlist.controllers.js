import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { Video } from "../models/video.models.js"
import { ActivityLog } from "../models/activitylog.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name?.trim()){
        throw new ApiError(400,"Name is required for playlist")
    }
    const existingPlaylist = await Playlist.findOne({
        name: name.trim(),
        owner: req.user._id,
    });
    if(existingPlaylist){
        throw new ApiError(400,"You already have a playlist with the same name")
    }
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description?.trim() || "",
        owner: req.user._id,
        videos: [],
    });
    if(!playlist){
        throw new ApiError(404,"Problem occurred while creating playlist")
    }
    return res.status(201).json(
        new ApiResponse(201,playlist,"Playlist created successfully ")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id");
    }
    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            populate: {
                path: "owner",
                select: "username avatar",
            },
            select: "title thumbnail views likeCount owner createdAt duration description",
        }).populate("owner", "username avatar");
    if (!playlist) {
        throw new ApiError(404, "Playlist does not exist");
    }
    if(playlist.visibility === "private" && playlist.owner._id.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to view this playlist")
    }
    const totalVideos = playlist.videos.length;
    const totalPages = Math.ceil(totalVideos / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedVideos = playlist.videos.slice(startIndex, endIndex);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                playlistId,
                playlistName: playlist.name,
                description: playlist.description,
                totalVideos,
                pagination: {
                    totalPages,
                    currentPage: page,
                    pageSize: limit,
                },
                videos: paginatedVideos,
            },
            "Fetched playlist videos successfully"
        )
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const page  = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid User Id")
    }
    const userExists = await User.exists({_id:userId})
    if(!userExists){
        throw new ApiError(404,"User not found")
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const visibilityFilter = req.user._id.toString() === userId? {} : { visibility: "public" };
    const userPlaylists = await Playlist.find({
        owner:userId,
        videos: {$exists:true,$not:{$size:0}},
        ...visibilityFilter,
    }).select("name description visibility createdAt")
    .skip(skip) // skip results for pagination
    .limit(parseInt(limit)) // limit per page
    .sort({ createdAt: -1 })  // Sort Like documents newest → oldest
    if(!userPlaylists|| userPlaylists.length === 0){
        return res.status(200).json(
            new ApiResponse(200, [], "No Playlists found for user")
        );
    }
    const totalPlaylists = await Playlist.countDocuments({
        owner:userId,
        videos: {$exists:true,$not:{$size:0}},
        ...visibilityFilter,
    });
    const totalPages = Math.ceil(totalPlaylists/parseInt(limit))
    return res.status(200).json(
        new ApiResponse(200,{
            playlists: userPlaylists,
            pagination: {
                totalPlaylists,
                totalPages,
                currentPage: parseInt(page),
                pageSize: parseInt(limit),
            },
        },
        "Fetched all Playlist of user successfully")
    );
});

const togglePlaylistVisibility = asyncHandler (async(req,res)=>{
    const {playlistId} = req.params;
    const {visibility} = req.body;
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"No playlist found")
    }
    if(playlist.owner._id.toString() !== req.user._id.toString()){
        throw new ApiError(401,"Unauthorized request")
    }
    const validVisibilities = ["public", "private", "unlisted"];
    if (!validVisibilities.includes(visibility)) {
        throw new ApiError(400, "Invalid visibility value");
    }
    playlist.visibility = visibility;
    await playlist.save();
    return res.status(200).json(
        new ApiResponse(200,playlist,"Playlist visibility changed successfully")
    )
})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist Id or Video Id");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [video, playlist] = await Promise.all([
            Video.findById(videoId).session(session),
            Playlist.findById(playlistId).session(session),
        ]);

        if (!video) throw new ApiError(404, "Video does not exist");
        if (!playlist) throw new ApiError(404, "Playlist does not exist");
        if (req.user._id.toString() !== playlist.owner.toString()) {
            throw new ApiError(403, "Unauthorized Request");
        }

        const updatedPlaylist = await Playlist.findOneAndUpdate(
            { _id: playlistId, owner: req.user._id },
            { $addToSet: { videos: videoId } },
            { new: true, session },
        );

        if (!updatedPlaylist) {
            throw new ApiError(404, "Playlist not found or unauthorized");
        }

        const responseData = {
            playlistId: updatedPlaylist._id,
            addedVideoId: videoId,
            name: updatedPlaylist.name,
            totalVideos: updatedPlaylist.videos.length,
        };

        await ActivityLog.create(
            [{
                user: req.user._id,
                action: "ADD_TO_PLAYLIST",
                target: videoId,
                playlist: playlistId,
            }],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(
            new ApiResponse(200, responseData, "Video added to playlist successfully")
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction failed:", error);
        throw error instanceof ApiError
            ? error
            : new ApiError(500, "Failed to add video to playlist. Transaction rolled back.");
    }
});


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist Id or Video Id");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [video, playlist] = await Promise.all([
            Video.findById(videoId).session(session),
            Playlist.findById(playlistId).session(session),
        ]);

        if (!video) throw new ApiError(404, "Video does not exist");
        if (!playlist) throw new ApiError(404, "Playlist does not exist");
        if (req.user._id.toString() !== playlist.owner.toString()) {
            throw new ApiError(403, "Unauthorized Request");
        }

        if (!playlist.videos.includes(videoId)) {
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json(
                new ApiResponse(200, null, "Video is not in the playlist")
            );
        }

        const updatedPlaylist = await Playlist.findOneAndUpdate(
            { _id: playlistId, owner: req.user._id },
            { $pull: { videos: videoId } },
            { new: true, session },
        );

        if (!updatedPlaylist) {
            throw new ApiError(404, "Playlist not found or unauthorized");
        }

        const responseData = {
            playlistId: updatedPlaylist._id,
            removedVideoId: videoId,
            name: updatedPlaylist.name,
            totalVideos: updatedPlaylist.videos.length,
        };

        await ActivityLog.create(
            [{
                user: req.user._id,
                action: "REMOVE_FROM_PLAYLIST",
                target: videoId,
                playlist: playlistId,
            }],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(
            new ApiResponse(200, responseData, "Video removed from playlist successfully")
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction failed:", error);
        throw error instanceof ApiError
            ? error
            : new ApiError(500, "Failed to remove video from playlist. Transaction rolled back.");
    }
});


const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const playlist = await Playlist.findById(playlistId).session(session);
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }
        if (playlist.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Unauthorized Request");
        }
        playlist.isDeleted = true;
        playlist.deletedAt = new Date();
        await playlist.save({ session });

        ActivityLog.create({
            user: req.user._id,
            action: "DELETE_PLAYLIST",
            target: playlistId,
            playlist: playlistId,
            metadata: {
                playlistName: playlist.name,
                totalVideos: playlist.videos.length,
            },
        }).catch(err => console.error("Failed to log activity:", err));

        await session.commitTransaction();
        session.endSession();
        
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    playlistId: playlist._id,
                    name: playlist.name,
                    deleted: true,
                    deletedAt: playlist.deletedAt,
                },
                "Playlist deleted successfully (soft deleted)"
            )
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction failed:", error);

        throw error instanceof ApiError
            ? error
            : new ApiError(500, "Failed to delete playlist");
    }
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }
    if (!name?.trim() && !description?.trim()) {
        throw new ApiError(400, "At least one field (name or description) must be provided to update");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const playlist = await Playlist.findById(playlistId).session(session);
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if (playlist.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Unauthorized request — you cannot modify this playlist");
        }

        if (name?.trim()) {
            const existingPlaylist = await Playlist.findOne({
                _id: { $ne: playlistId },
                owner: req.user._id,
                name: name.trim(),
            }).session(session);

            if (existingPlaylist) {
                throw new ApiError(400, "You already have a playlist with the same name");
            }
        }

        const updateFields = {};
        if (name?.trim()) updateFields.name = name.trim();
        if (description?.trim() || description === "")
            updateFields.description = description?.trim() || "";

        const updatedPlaylist = await Playlist.findOneAndUpdate(
            { _id: playlistId, owner: req.user._id },
            { $set: updateFields },
            { new: true, runValidators: true, session }
        );

        if (!updatedPlaylist) {
            throw new ApiError(500, "Failed to update playlist");
        }

        await ActivityLog.create(
            [{
                user: req.user._id,
                action: "UPDATE_PLAYLIST",
                target: playlistId,
                playlist: playlistId,
                metadata: { updatedFields: Object.keys(updateFields) },
            }],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        const responseData = {
            playlistId: updatedPlaylist._id,
            name: updatedPlaylist.name,
            description: updatedPlaylist.description,
            totalVideos: updatedPlaylist.videos.length,
            updatedAt: updatedPlaylist.updatedAt,
        };

        return res.status(200).json(
            new ApiResponse(200, responseData, "Playlist updated successfully")
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction failed:", error);

        throw error instanceof ApiError
            ? error
            : new ApiError(500, "Failed to update playlist. Transaction rolled back.");
    }
});



export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    togglePlaylistVisibility,
}