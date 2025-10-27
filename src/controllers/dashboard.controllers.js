import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { VideoView } from "../models/views.models.js"
import { ActivityLog } from "../models/activitylog.global.models.js"

const getChannelStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid channel/user ID");
  }
  const channelObjectId = new mongoose.Types.ObjectId(userId);

  const baseMatch = {
    owner: channelObjectId,
    isDeleted: { $ne: true },
    visibility: { $ne: "private" },
  };

  const [
    subscribers,
    subscribedTo,
    totalVideos,
    resultViews,
    resultLikes,
    top5Viewed,
    top5Liked,
    averageViews,
    averageLikes,
  ] = await Promise.all([
    Subscription.countDocuments({ channel: userId }),
    Subscription.countDocuments({ subscriber: userId }),
    Video.countDocuments({ owner: userId }),
    Video.aggregate([
      { $match: baseMatch },
      { $group: { _id: null, totalViews: { $sum: "$views" }, totalVideos: { $sum: 1 } } },
    ]),
    Video.aggregate([
      { $match: baseMatch },
      { $group: { _id: null, totalLikes: { $sum: "$likeCount" } } },
    ]),
    Video.aggregate([
        {$match: 
            baseMatch,
        },
        {$sort: {views: -1}},
        {$limit: 5},
        {
            $lookup:
            {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerInfo",
            },
        },
        {$unwind:"$ownerInfo"},
        {
            $project: {
                _id: 1,
                title: 1,
                thumbnail: 1,
                views: 1,
                likeCount: 1,
                createdAt: 1,
                "ownerInfo._id": 1,
                "ownerInfo.username": 1,
                "ownerInfo.avatar": 1,
            },
        },
    ]).allowDiskUse(true),
    Video.aggregate([
        {$match: 
            baseMatch,
        },
        {$sort: {likeCount: -1}},
        {$limit: 5},
        {
            $lookup:
            {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerInfo",
            },
        },
        {$unwind:"$ownerInfo"},
        {
            $project: {
                _id: 1,
                title: 1,
                thumbnail: 1,
                views: 1,
                likeCount: 1,
                createdAt: 1,
                "ownerInfo._id": 1,
                "ownerInfo.username": 1,
                "ownerInfo.avatar": 1,
            },
        },
    ]).allowDiskUse(true),
    Video.aggregate([
      { $match: baseMatch },
      { $group: { _id: null, avgViews: { $avg: "$views" }, } },
    ]),
    Video.aggregate([
      { $match: baseMatch },
      { $group: { _id: null, avgLikes: { $avg: "$likeCount" }, } },
    ])
  ]);
  const engagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2): 0;
  const avgViews = averageViews[0]?.avgViews || 0;
  const avgLikes = averageLikes[0]?.avgLikes || 0;
  const totalViews = resultViews[0]?.totalViews || 0;
  const totalLikes = resultLikes[0]?.totalLikes || 0;
  
  ActivityLog.create({
  user: req.user._id,
  action: "GET_CHANNEL_STATS",
  target: userId,
  targetModel: "User",
  metadata: { totalVideos, totalViews, totalLikes }
  }).catch(console.error);
  
return res.status(200).json(
    new ApiResponse(200, {
      channelId: userId,
      totalSubscribers: subscribers,
      totalSubscribedTo: subscribedTo,
      totalVideos,
      totalLikes,
      totalViews,
      top5Viewed,
      top5Liked,
      avgViews,
      avgLikes,
      engagementRate,
    }, "Channel stats fetched successfully")
  );
});


const getChannelVideos = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel id")
    }
    if(channelId !== req.user._id.toString()){
        throw new ApiError(403,"Unauthorized request")
    }
    const getChannelVideos = await Video.find({
        owner:channelId,
        isPublished: {$ne:false},
        isDeleted: { $ne: true },
    }).populate({
        path:"owner",
        select:"username avatar"
    }).select("title thumbnail views likeCount owner createdAt duration description").lean()
    if(getChannelVideos.length === 0){
        return res.status(200).json(
            new ApiResponse(200,[],"No videos posted yet")
        )
    }
    ActivityLog.create([{
            user: req.user._id,
            action: "GET_CHANNEL_VIDEOS",
            target: channelId,
            targetModel: "Video",
            metadata: {},
    }])
    return res.status(200).json(
        new ApiResponse(200,getChannelVideos,"Fetched channel vidoes successfully")
    )
});

export {
    getChannelStats, 
    getChannelVideos
    }