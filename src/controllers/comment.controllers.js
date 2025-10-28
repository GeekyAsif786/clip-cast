import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { ActivityLog } from "../models/activitylog.global.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Object Id")
    }
    const videoExists = await Video.exists({_id:videoId})
    if(!videoExists){
        throw new ApiError(404,"Video not found")
    }
     const pipeline = [
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "users",
        let: { ownerId: "$owner" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
          { $project: { username: 1, avatar: 1 } },
        ],
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    { $sort: { createdAt: -1 } },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const comments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments: comments.docs,
        pagination: {
          totalComments: comments.totalDocs,
          totalPages: comments.totalPages,
          currentPage: comments.page,
          pageSize: comments.limit,
          hasNextPage: comments.hasNextPage,
          hasPrevPage: comments.hasPrevPage,
        },
      },
      "Fetched video comments successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  if (!content?.trim()) {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const video = await Video.findById(videoId).session(session);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create(
      [
        {
          content: content.trim(),
          video: videoId,
          owner: req.user._id,
        },
      ],
      { session }
    );

    if (!comment?.length) {
      throw new ApiError(500, "Failed to create comment");
    }

    await Video.findByIdAndUpdate(
      videoId,
      { $inc: { commentCount: 1 } },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    await comment[0].populate("owner", "username avatar");

    ActivityLog.create({
      user: req.user._id,
      action: "ADD_COMMENT",
      target: videoId,
      targetModel: "Video",
      metadata: { commentId: comment[0]._id },
    }).catch((err) => console.error("ActivityLog failed:", err));

    return res
      .status(201)
      .json(new ApiResponse(201, comment[0], "Successfully commented on video"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Transaction failed:", error);
    throw error instanceof ApiError
      ? error
      : new ApiError(500, "Failed to comment on video. Transaction rolled back.");
  }
});


const updateComment = asyncHandler(async (req, res) => {
  const { commentId, videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Updated content cannot be empty");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const video = await Video.findById(videoId).session(session);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.findById(commentId).session(session);
    if (!comment) {
      throw new ApiError(404, "Comment does not exist");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Unauthorized request — cannot edit this comment");
    }

    comment.content = content.trim();
    comment.editedAt = new Date();
    await comment.save({ session });

    await session.commitTransaction();
    session.endSession();

    ActivityLog.create({
      user: req.user._id,
      action: "UPDATE_COMMENT",
      target: commentId,
      targetModel: "Comment",
      metadata: {
        videoId,
        newContent: comment.content,
        editedAt: comment.editedAt,
      },
    }).catch((err) => console.error("Failed to log comment update:", err));

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment updated successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Transaction failed:", error);
    throw error instanceof ApiError
      ? error
      : new ApiError(500, "Failed to update comment. Transaction rolled back.");
  }
});


const deleteComment = asyncHandler(async (req, res) => {
  const { videoId, commentId } = req.params;

  if (!isValidObjectId(commentId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Object ID");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const video = await Video.findById(videoId).session(session);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.findById(commentId).session(session);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Unauthorized request — cannot delete this comment");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId, { session });
    if (!deletedComment) {
      throw new ApiError(500, "Failed to delete comment");
    }

    // Decrement comment count only if delete succeeded
    await Video.findByIdAndUpdate(
      videoId,
      { $inc: { commentCount: -1 } },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    // Optional: Log the deletion asynchronously (non-blocking)
    ActivityLog.create({
      user: req.user._id,
      action: "DELETE_COMMENT",
      target: commentId,
      targetModel: "Comment",
      metadata: {
        videoId,
        deletedAt: new Date(),
      },
    }).catch((err) => console.error("Failed to log comment deletion:", err));

    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedComment, "Comment deleted successfully")
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Transaction failed:", error);
    throw error instanceof ApiError
      ? error
      : new ApiError(500, "Failed to delete comment. Transaction rolled back.");
  }
});


export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }