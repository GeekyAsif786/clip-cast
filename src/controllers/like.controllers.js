import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import { Video } from "../models/video.models.js"
import { Comment } from "../models/comment.models.js"
import { Tweet } from "../models/tweet.models.js"
import { User } from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }
    const video = await Video.exists({_id:videoId});
    if(!video){
        throw new ApiError(404,"Content Unavailable")
    }
    const existingLike = await Like.findOne({
        video : videoId, 
        likedBy : req.user._id,
    })
    let like;
    if(!existingLike){
        like = await Like.create({
            video:videoId,
            likedBy:req.user._id,
        })
        if(like){
            await Video.findByIdAndUpdate(videoId,
                {
                    $inc: {
                        likeCount: 1,
                    },
                },
                { new : true}
            )
        }
    }
    else{
        like = await Like.findByIdAndDelete(existingLike._id)
        await Video.findByIdAndUpdate(videoId,
            {
                $inc: {
                    likeCount: -1,
                },
            },
            { new : true }
        )
    }
    const message = existingLike ? "Video unliked successfully" : "Video liked successfully";
    return res.status(200).json(
        new ApiResponse(200,like,message)
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID");
    }
    let comment = await Comment.exists({_id:commentId})
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id,
    })
    let like;
    if(!existingLike){
        like = await Like.create({
            comment: commentId,
            likedBy: req.user._id,
        })
        if(like){
             await Comment.findByIdAndUpdate(
                commentId,
                {
                    $inc: {
                        likeCount: 1,
                    },
                },
                { new : true },
             )
        }
        else{
            throw new ApiError(408,"Request Timeout")
        }
    }
    else{
        like = await Like.findByIdAndDelete(existingLike._id)
        await Comment.findByIdAndUpdate(commentId,
            {
                $inc: {
                    likeCount: -1,
                },
            },
            { new : true },
        )
    }
    const message = existingLike ? "Comment Unliked successfully" : "Comment Liked successfully";
    return res.status(200).json(
        new ApiResponse(200,like,message)
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Tweeet Id")
    }
    let tweet = await Tweet.exists({_id:tweetId})
    if(!tweet){
        throw new ApiError(404,"Tweet not found")
    }
    const existingLike = await Like.findOne(
        {
            tweet: tweetId,
            likedBy: req.user._id
        }
    )
    let like;
    if(!existingLike){
        like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id,
        })
        if(like){
            await Tweet.findByIdAndUpdate(
                tweetId,
                {
                    $inc: {
                        likeCount: 1,
                    },
                },
                {new:true}
            )
        }
        else{
            throw new ApiError(404,"Could not be processed")
        }
    }
    else{
        like = await Like.findByIdAndDelete(existingLike._id)
        await Tweet.findByIdAndUpdate(tweetId,
            {
                $inc: {
                    likeCount: -1,
                },
            },
            {new:true}
        )
    }
    const message = existingLike ? "Tweet Unliked successfully" : "Tweet Liked successfully";
    return res.status(200).json(
        new ApiResponse(200,like,message)
    )}
)

const getLikedVideos = asyncHandler(async (req, res) => {
        // sortBy = "createdAt",
        // sortOrder = "desc",
    const page  = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const user = await User.findById(req.user._id)
    if(!user){
        throw new ApiError(401,"Unauthorized access")
    }

      // Convert to numbers for safety
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const likes = await Like.find({
        likedBy: req.user._id,
        video: { $exists: true, $not: { $size: 0 } }
    })
    .populate({
        path:"video",
        populate: {
            path:"owner",
            select:"username",
        },
        select:"title thumbnail views likeCount owner createdAt duration description"
    })
    .skip(skip) // skip results for pagination
    .limit(parseInt(limit)) // limit per page
    .sort({ createdAt: -1 })  // Sort Like documents newest → oldest
    if (!likes || likes.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No liked videos found")
        );
    }
    const likedVideos = likes.map(like => like.video).filter(Boolean);
    
    // Get total count for frontend to know how many pages
    const totalLikes = await Like.countDocuments({
        likedBy: req.user._id,
        video: { $exists: true, $not: { $size: 0 } }
    });
    const totalPages = Math.ceil(totalLikes/parseInt(limit));
    return res.status(200).json(
        new ApiResponse(200,
            {
            likedVideos,
            pagination: {
                totalLikes,
                totalPages,
                currentPage: parseInt(page),
                pageSize: parseInt(limit),
            },
        },
        "Fetched all liked videos successfully")
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}