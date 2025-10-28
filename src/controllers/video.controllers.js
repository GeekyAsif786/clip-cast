import mongoose from "mongoose";
import { VideoView } from "../models/videoView.model.js";
import { ActivityLog } from "../models/activitylog.global.models.js"
import { isValidObjectId } from "mongoose";
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteImageFromCloudinary,deleteVideoFromCloudinary} from "../utils/cloudinary.js"


const recordVideoView = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const WINDOW_MS = 10 * 60 * 1000; // --> 10 minutes window

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const since = new Date(Date.now() - WINDOW_MS);
    if (req.user && req.user._id) {
      const recentView = await VideoView.findOne({
        video: videoId,
        viewer: req.user._id,
        viewedAt: { $gt: since },
      }).session(session);

      if (recentView) {
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json(
          new ApiResponse(200, { viewed: false }, "Recent view already recorded")
        );
      }
      await VideoView.create(
        [
          {
            video: videoId,
            viewer: req.user._id,
            ip: req.ip,
            userAgent: req.get("user-agent") || "",
          },
        ],
        { session }
      );

      await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { session }
      );
      await ActivityLog.create(
        [
          {
            user: req.user._id,
            action: "VIEW_VIDEO",
            target: videoId,
            targetModel: "Video",
            metadata: { ip: req.ip },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json(
        new ApiResponse(200, { viewed: true }, "View recorded")
      );
    } else {
      const userAgent = req.get("user-agent") || "";
      const recentView = await VideoView.findOne({
        video: videoId,
        viewer: null,
        ip: req.ip,
        userAgent,
        viewedAt: { $gt: since },
      }).session(session);

      if (recentView) {
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json(
          new ApiResponse(200, { viewed: false }, "Recent view already recorded")
        );
      }
      await VideoView.create(
        [
          {
            video: videoId,
            viewer: null,
            ip: req.ip,
            userAgent,
          },
        ],
        { session }
      );

      await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { session }
      );
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json(
        new ApiResponse(200, { viewed: true }, "View recorded")
      );
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("recordVideoView transaction error:", err);
    throw err instanceof ApiError
      ? err
      : new ApiError(500, "Failed to record view. Transaction rolled back.");
  }
});


const publishAVideo = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { title, description } = req.body;
        const owner = req.user._id;

        if (!title || title.trim() === "") {
            throw new ApiError(400, "Title is required");
        }
        if (!description || description.trim() === "") {
            throw new ApiError(400, "Description is required");
        }

        const videoLocalPath = req.files?.videoFile?.[0]?.path;
        const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

        if (!videoLocalPath || !thumbnailLocalPath) {
            throw new ApiError(400, "Both video and thumbnail are required");
        }

        const videoFile = await uploadOnCloudinary(videoLocalPath);
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!videoFile) {
            throw new ApiError(400, "Video failed to upload");
        }
        if (!thumbnail) {
            throw new ApiError(400, "Thumbnail upload failed");
        }

        const video = await Video.create(
            [
                {
                    title: title.trim(),
                    description: description.trim(),
                    videoFile: videoFile.url,
                    thumbnail: thumbnail.url,
                    isPublished: true,
                    duration: videoFile.duration,
                    owner,
                },
            ],
            { session }
        );

        if (!video || !video[0]?._id) {
            throw new ApiError(500, "Video document creation failed");
        }

        const createdVideo = await Video.findById(video[0]._id)
            .session(session);

        if (!createdVideo) {
            throw new ApiError(500, "Something went wrong while uploading the video");
        }
        await ActivityLog.create(
        [
            {
            user: req.user._id,
            action: "PUBLISH_VIDEO",
            target: video._id,
            targetModel: "Video",
            metadata: {
                ip: req.ip,
                userAgent: req.get("user-agent"),
                title: video.title,
                videoId: video._id,
                duration: video.duration,
                timestamp: new Date(),
            },
            },
        ],
        { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json(
            new ApiResponse(201, createdVideo, "Video uploaded successfully")
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});


const getVideoBySearch = asyncHandler (async (req,res) => {
    // Extract query params with defaults
  const {
    search = "",             // search keyword
    category,                // optional category filter
    sortBy = "createdAt",    // sort field
    sortOrder = "desc",      // sort direction
    limit = 10,              // results per page
    page = 1                 // pagination page
  } = req.query;

  // Build MongoDB query object
  const query = {};

  // Search by title or description
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Pagination math
  const skip = (parseInt(page,10) - 1) * parseInt(limit,10);

  // Fetch videos from DB
  const videos = await Video.find(query)
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 }) //ternary operator structure --> condition ? exprIfTrue : exprIfFalse
    .skip(skip)
    .limit(parseInt(limit));

  // Count total results for pagination
  const totalVideos = await Video.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalVideos / parseInt(limit)),
      videos
    }, "Videos fetched successfully")
  );
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(req.params === ""){
        throw new ApiError(204, "field cannot be empty")
    }
    const video = await Video.findById(videoId)
    if(!video || video ===""){
        throw new ApiError(404, "Video not found")
    }
    res
    .status(200)
    .json(
        new ApiResponse(200,video,"Here are the Results:")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const findVideo = await Video.findById(videoId)
    
    const owner = await req.user._id
    if(!findVideo){
        throw new ApiError(404,"Video not found")
    }
    const { newTitle, newDescription } = req.body
    const newThumbnailLocalPath = req.file?.path;
    //const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)
    let newThumbnail;
    if(newThumbnailLocalPath){
        newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)
        if(!newThumbnail.url){
            throw new ApiError(500,"Thumbnail upload failed, kindly retry")
        }
        if (findVideo.thumbnail) {
            // Delete old thumbnail safely AFTER new upload succeeds
        try {
            const publicId = findVideo.thumbnail.split('/').pop().split('.')[0];
            await deleteImageFromCloudinary(publicId);
        } 
        catch (err) {
            console.warn("Failed to delete old thumbnail:", err.message);
        }
    }
    }
    
    if(!newTitle && !newDescription && !newThumbnailLocalPath){
        throw new ApiError(400,"All fields can't be empty")
    }
    const updateFields = {

    };
    if(newThumbnail) updateFields.thumbnail = newThumbnail.url; 
    if (newTitle) updateFields.title = newTitle;
    if (newDescription) updateFields.description = newDescription;

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video details updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"Params are empty")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    if(!(video.owner.toString() === req.user._id.toString())){
        throw new ApiError(401,"Unauthorized Request")
    }
    const videoPublicId = video.videoFile.split('/').pop().split('.')[0];
    const thumbnailPublicId = video.thumbnail.split('/').pop().split('.')[0];
    try {
        await deleteImageFromCloudinary(thumbnailPublicId)
    } 
    catch (error) {
        console.log("Deletion of thumbnail from cloudinary failed",error.message)
    }
    try {
        await deleteVideoFromCloudinary(videoPublicId)
    } 
    catch (error) {
        console.log("Deletion of Video from cloudinary failed",error.message)
    }
    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        console.warn("Video could not be deleted")
        throw new ApiError(500, "Video could not be deleted")
    }
    return res.status(200).json(
        new ApiResponse(200,deletedVideo,"Video deleted successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"Content Unavailable")
    }
    let video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    if(!(video.owner.toString() === req.user._id.toString())){
        throw new ApiError(401,"Unauthorized Access")
    }
    let message = "";
    if(video.isPublished === true){
        video = await Video.findByIdAndUpdate(
            videoId,
            { $set: {
                isPublished:false
                },
            },
            { new:true }
        )
        message = "Video unpublished successfully"
    }
    else if(video.isPublished === false){
        video = await Video.findByIdAndUpdate(
            videoId,
            { $set: {
                isPublished: true
                }
            },
            { new : true }
        )
        message = "Video published successfully"
    }
    res.status(200).json(
        new ApiResponse(200,video,message)
    )
})

export {
    recordVideoView,
    publishAVideo,
    getVideoById,
    getVideoBySearch,
    updateVideo, 
    deleteVideo,
    togglePublishStatus
}