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
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const video = await Video.findById(videoId).session(session);
    if (!video) {
      throw new ApiError(404, "Video not found or unavailable");
    }

    const existingLike = await Like.findOne({
      video: videoId,
      likedBy: req.user._id,
    }).session(session);

    let message = "";
    let likeDoc = null;
    let liked = false;

    if (!existingLike) {
      const [newLike] = await Like.create(
        [
          {
            video: videoId,
            likedBy: req.user._id,
          },
        ],
        { session }
      );
      likeDoc = newLike;

      await Video.findByIdAndUpdate(
        videoId,
        { $inc: { likeCount: 1 } },
        { new: true, session }
      );

      message = "Video liked successfully";
      liked = true;
    } else {
      await Like.findByIdAndDelete(existingLike._id, { session });

      await Video.findByIdAndUpdate(
        videoId,
        { $inc: { likeCount: -1 } },
        { new: true, session }
      );

      message = "Video unliked successfully";
      liked = false;
    }

    await session.commitTransaction();
    session.endSession();

    ActivityLog.create({
      user: req.user._id,
      action: liked ? "LIKE_VIDEO" : "UNLIKE_VIDEO",
      target: videoId,
      targetModel: "Video",
      metadata: {},
    }).catch(err => console.error("Like log failed:", err));

    return res
      .status(200)
      .json(new ApiResponse(200, { liked, likeDoc }, message));

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("toggleVideoLike failed:", error);

    throw error instanceof ApiError
      ? error
      : new ApiError(500, "Failed to toggle like. Transaction rolled back.");
  }
});


const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const comment = await Comment.findById(commentId).session(session);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    const existingLike = await Like.findOne({
      comment: commentId,
      likedBy: req.user._id,
    }).session(session);

    let likeDoc = null;
    let liked = false;
    let message = "";

    if (!existingLike) {
      const [newLike] = await Like.create(
        [
          {
            comment: commentId,
            likedBy: req.user._id,
          },
        ],
        { session }
      );

      likeDoc = newLike;

      await Comment.findByIdAndUpdate(
        commentId,
        { $inc: { likeCount: 1 } },
        { new: true, session }
      );

      message = "Comment liked successfully";
      liked = true;
    } else {
      await Like.findByIdAndDelete(existingLike._id, { session });

      await Comment.findByIdAndUpdate(
        commentId,
        { $inc: { likeCount: -1 } },
        { new: true, session }
      );

      message = "Comment unliked successfully";
      liked = false;
    }

    await session.commitTransaction();
    session.endSession();

    ActivityLog.create({
      user: req.user._id,
      action: liked ? "LIKE_COMMENT" : "UNLIKE_COMMENT",
      target: commentId,
      targetModel: "Comment",
    }).catch(err => console.error("Activity log failed:", err));

    return res
      .status(200)
      .json(new ApiResponse(200, { liked, likeDoc }, message));

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("toggleCommentLike failed:", error);

    throw error instanceof ApiError
      ? error
      : new ApiError(500, "Failed to toggle comment like. Transaction rolled back.");
  }
});


const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tweet = await Tweet.findById(tweetId).session(session);
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }

    const existingLike = await Like.findOne({
      tweet: tweetId,
      likedBy: req.user._id,
    }).session(session);

    let likeDoc = null;
    let liked = false;
    let message = "";

    if (!existingLike) {
      const [newLike] = await Like.create(
        [
          {
            tweet: tweetId,
            likedBy: req.user._id,
          },
        ],
        { session }
      );

      likeDoc = newLike;

      await Tweet.findByIdAndUpdate(
        tweetId,
        { $inc: { likeCount: 1 } },
        { new: true, session }
      );

      liked = true;
      message = "Tweet liked successfully";
    } else {
      await Like.findByIdAndDelete(existingLike._id, { session });

      await Tweet.findByIdAndUpdate(
        tweetId,
        { $inc: { likeCount: -1 } },
        { new: true, session }
      );

      liked = false;
      message = "Tweet unliked successfully";
    }

    await session.commitTransaction();
    session.endSession();

    ActivityLog.create({
      user: req.user._id,
      action: liked ? "LIKE_TWEET" : "UNLIKE_TWEET",
      target: tweetId,
      targetModel: "Tweet",
    }).catch(err => console.error("Activity log failed:", err));

    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked, likeDoc }, message)
      );

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("toggleTweetLike transaction failed:", error);

    throw error instanceof ApiError
      ? error
      : new ApiError(500, "Failed to toggle tweet like. Transaction rolled back.");
  }
});


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