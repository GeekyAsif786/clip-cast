import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"


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

const getPlaylistsVideos = asyncHandler(async (req, res) => {
    /*
        Validate the playlistId (not userId)
        Check if that playlist exists and belongs to the user
        Populate all the videos in it
        Paginate if needed
        Return a clean structured response
    */
    const { playlistId } = req.params;
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
        });
    if (!playlist) {
        throw new ApiError(404, "Playlist does not exist");
    }
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "Unauthorized Request");
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
    //TODO: get user playlists
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistsVideos,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}