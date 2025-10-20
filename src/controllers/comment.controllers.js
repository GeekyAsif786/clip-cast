import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

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
    const {videoId} = req.params
    const {content} = req.body
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid object Id")
    }
    const video = await Video.exists({_id:videoId})
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    if(!content) {
        throw new ApiError(404,"Comment content cannot be empty")
    }
    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user._id,
    })
    if(comment){
        await Video.findByIdAndUpdate(videoId,
            {
                $inc:{
                    commentCount:1
                },
            },
            {new:true}
        )
    }
    else{
        throw new ApiError(404,"Cannot comment on the video")
    }
    await comment.populate("owner", "username avatar")
    return res.status(201).json(
        new ApiResponse(201,comment,"Successfully commented on video")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId,videoId} = req.params
    const {content} = req.body
    if(!isValidObjectId(commentId)){
        throw new ApiError(404,"Invalid Object Id")
    }
    const video = await Video.exists({_id:videoId})
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    let comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"Comment does not exist")
    }
    if(!(comment.owner.toString() === req.user._id.toString())){
        throw new ApiError(401,"Unauthrized Request")
    }
    if(content && content.trim() !== ""){
        comment.content = content.trim();
        await comment.save();
    }
    else{
        console.log("No content to update")
    }
    return res.status(200).json(
        new ApiResponse(200,comment,"Comment updated Successfully")
    )
    
})

const deleteComment = asyncHandler(async (req, res) => { 
    // TODO: delete a comment
    const {videoId,commentId} = req.params
    if(!isValidObjectId(commentId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Object Id")
    }
    const videoExists = await Video.exists({_id:videoId})
    let comment = await Comment.findById(commentId)
    if(!videoExists){
        throw new ApiError(404,"Video not found")
    }
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }
    if(!(comment.owner.toString()===req.user._id.toString())){
        throw new ApiError(401,"Unauthorized Request")
    }
    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if(deletedComment){
        await Video.findByIdAndUpdate(videoId,{
            $inc:{
                commentCount: -1
            },
        });
    }
    return res.status(200).json(
        new ApiResponse(200,deletedComment,"Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }