import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { use } from "react"


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
    if(playlist.owner.toString() !== req.user._id.toString()){
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
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    togglePlaylistVisibility,
}