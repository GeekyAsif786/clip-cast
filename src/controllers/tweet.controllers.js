import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ActivityLog } from "../models/activitylog.global.models.js"

const createTweet = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { content } = req.body;
        const files = req.files;

        if ((!content || content.trim().length === 0) && (!files || files.length === 0)) {
            throw new ApiError(400, "Tweet cannot be empty — add text or media");
        }

        const fileLocalPath = files?.[0]?.path;
        let uploadedFile = null;

        if (fileLocalPath) {
            uploadedFile = await uploadOnCloudinary(fileLocalPath);
            if (!uploadedFile) {
                throw new ApiError(500, "Failed to upload media");
            }
        }

        const newTweet = await Tweet.create(
            [
                {
                    content: content?.trim() || "",
                    owner: req.user._id,
                    media: uploadedFile?.url || "",
                },
            ],
            { session }
        );

        if (!newTweet || newTweet.length === 0) {
            throw new ApiError(500, "Failed to create tweet");
        }

        await ActivityLog.create(
            [
                {
                    user: req.user._id,
                    action: "CREATE_TWEET",
                    description: `User created a new tweet`,
                    metadata: {
                        tweetId: newTweet[0]._id,
                        hasMedia: !!uploadedFile,
                    },
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        const responseData = {
            id: newTweet[0]._id,
            content: newTweet[0].content,
            media: newTweet[0].media,
            owner: newTweet[0].owner,
            createdAt: newTweet[0].createdAt,
        };

        return res
            .status(201)
            .json(new ApiResponse(201, responseData, "Tweet created successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});


const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    const page  = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user id")
    }
    const skip = (parseInt(page)-1) *parseInt(limit) 
    const [uploadedTweets,totalTweets] = await Promise.all([ 
        Tweet.find({
            owner:userId,
        }).populate({
            path: "owner",
            select: "username avatar coverImage subscribersCount"
        }).skip(skip).limit(limit).sort({createdAt: -1}).lean(),
        Tweet.countDocuments({
            owner: userId,
        })
    ]);
    if(!uploadedTweets || uploadedTweets.length === 0){
        return res.status(200).json(
            new ApiResponse(200,{
            tweets: [],
            pagination: {
                totalTweets,
                totalPages: 0,
                currentPage: page,
                pageSize: limit
            }
        },"No tweets found for user")
        )
    }

    const totalPages = Math.ceil(totalTweets/parseInt(limit));
    return res.status(200).json(
        new ApiResponse(200,{
            uploadedTweets,
            pagination:{
                totalTweets,
                totalPages,
                currentPage: page,
                pageSize: limit,
            }
        })
    )
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { updatedContent } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet Id");
    }

    const trimmedContent = updatedContent?.trim();
    if (!trimmedContent) {
        throw new ApiError(400, "Content cannot be empty");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tweet = await Tweet.findOneAndUpdate(
            { _id: tweetId, owner: req.user._id },
            { $set: { content: trimmedContent, editedAt: new Date() } },
            { new: true, session }
        ).select("content owner createdAt likeCount");

        if (!tweet) {
            throw new ApiError(404, "Tweet not found or unauthorized");
        }
        await ActivityLog.create([{
            user: req.user._id,
            action: "UPDATE_TWEET",
            target: tweetId,
            targetModel: "Tweet",
            metadata: { newContent: trimmedContent },
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(
            new ApiResponse(200, tweet, "Tweet updated successfully")
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction failed:", error);
        throw error instanceof ApiError
            ? error
            : new ApiError(500, "Failed to update tweet. Transaction rolled back.");
    }
});


const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet Id")
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const tweet = await Tweet.findOneAndUpdate(
        {_id:tweetId, owner:req.user._id, isDeleted:false},
        {$set:{isDeleted:true, deletedAt: new Date()}},
        {new:true,session},
    ).select("owner deletedAt")
    if(!tweet){
        throw new ApiError(404,"Unable to delete tweet")
    }
    const deletedContent=tweet.content;
    ActivityLog.create([{
        user: req.user._id,
        action:"DELETE_TWEET",
        target:tweetId,
        targetModel:"Tweet",
        metadata:{content:deletedContent, isDeleted: true,deletedAt:tweet.deletedAt},
    }], {session});
    
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
        new ApiResponse(200, {
            tweetId: tweet._id,
            deletedAt: tweet.deletedAt,
        }, "Tweet deleted successfully")
    );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Transaction failed:", error);
        throw error instanceof ApiError
            ? error
            : new ApiError(500, "Failed to delete tweet. Transaction rolled back.");
    }

});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}