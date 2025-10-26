import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    const files = req.files;
    if ((!content || content.trim().length === 0) && (!files || files.length === 0)) {
        throw new ApiError(400, "Tweet cannot be empty — add text or media");
    }
    const filelocalPath = req.file?.file[0]?.path;
    const uploadedFile = await uploadOnCloudinary(filelocalPath)
    if(!uploadedFile){
        throw new ApiError(500,"Failed to upload media")
    }

    const newTweet = await Tweet.create({
        content:content.trim(),
        owner:req.user._id,
        media:uploadedFile?.url || "",
    })
    const responseData = {
        id: newTweet._id,
        content: newTweet.content,
        media:newTweet.media,
        owner: newTweet.owner,
        createdAt: newTweet.createdAt,
    };
    if(!newTweet){
        throw new ApiError(500,"Failed to create tweet")
    }
    return res.status(201).json(
        new ApiResponse(201,responseData,"Tweet created successfully")
    )
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}