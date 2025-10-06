import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const owner = req.user._id
    // TODO: get video, upload to cloudinary, create video
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
    if(!createdVideo){
        throw new ApiError(500, "Something went wrong while uploading the Video")
    }

    return res.status(201).json(
        new ApiResponse(200,createdVideo,"Video Uploaded Successfully")
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
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Fetch videos from DB
  const videos = await Video.find(query)
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
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
    //TODO: get video by id
    if(req.params === ""){
        throw new ApiError(400, "Search field cannot be empty")
    }
    const video = await Video.findById(videoId)
    if(!video || video ===""){
        throw new ApiError(404, "Video not found")
    }
    console.log("Video returns this o/p: ",video)
    res
    .status(200)
    .json(
        new ApiResponse(200,video,"Here are the Results:")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

//exporting all the methods
export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    getVideoBySearch,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}