import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteImageFromCloudinary,deleteVideoFromCloudinary} from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middleware.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    //TODO: get all videos based on query, sort, pagination


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const owner = req.user._id
    ////check for title and description
    ////use multer to get the video and thumbnail
    ////check if the video and thumbnail are succesfully delivered to localpath
    ////upload them to cloudinary
    ////create video object - create entry in DataBase
    ////check for published video
    ////return response
    if(!title || title === ""){
        throw new ApiError(400,"Title is required")
    }
    if(!description || description === ""){
        throw new ApiError(400,"Title is required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(400,"Both Video and Thumbnail are required")
    }

    //Uploading the file from local server to Cloudinary via cloudinary method created and stored in utils
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!videoFile){
        throw new ApiError(400, "Video failed to upload")
    }
    if(!thumbnail){
        throw new ApiError(400, "Thumbnail Upload failed")
    }


    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        isPublished:true,
        duration: videoFile.duration,
        owner,
    })

    const createdVideo = await Video.findById(video._id)
    console.log(createdVideo)
    if(!createdVideo){
        throw new ApiError(500, "Something went wrong while uploading the Video")
    }

    return res.status(201).json(
        new ApiResponse(200,video,"Video Uploaded Successfully")
    )
})

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
            { new: true }
        )
        message = "Video published successfully"
    }
    res.status(200).json(
        new ApiResponse(200,video,message)
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    getVideoBySearch,
    updateVideo, 
    deleteVideo,
    togglePublishStatus
}