import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid Channel Id")
    }
    if(channelId.toString()===req.user._id.toString()){
        throw new ApiError(400,"Cannot Self-Subscribe")
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const existingSubscription = await Subscription.find({
        subscriber: req.user._id,
        channel: channelId,
        }).session(session);

        let result,message;

        if(existingSubscription){
            await existingSubscription.deleteOne({session});
            await User.findByIdAndUpdate(channelId,{
                $inc:{
                    subscribersCount: -1,
                },
            },{new:true,session})
            await User.findByIdAndUpdate(req.user._id,{
                $inc:{
                    channelsSubscribedToCount: -1,
                },
            },{new:true,session})
            message = "Unsubscribed Successfully";
            result = { subscribed: false };
        }
        else{
            await Subscription.create([
                {
                subscriber: req.user._id,
                channel: channelId,
                },
            ],{ session });
            await User.findByIdAndUpdate(channelId,{
                $inc:{
                    subscribersCount: 1,
                },
            },{new:true, session })
            await User.findByIdAndUpdate(req.user._id,{
                $inc:{
                    channelsSubscribedToCount: 1,
                },
                },{new:true, session })
                message = "Subscribed Successfully"
                result = { subscribed: true };
        }
        await session.commitTransaction();
        return res.status(200).json(
            new ApiResponse(200,result,message)
        );
    }
    catch(error){
        await session.abortTransaction();
        throw error;
    }
    finally{
        session.endSession();
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid Channel Id")
    }
    const channelExists = await User.exists({_id:channelId})
    if(!channelExists){
        throw new ApiError(404,"Channel does not exist")
    }
    const totalSubscribers = await Subscription.countDocuments({
        channel:mongoose.Types.ObjectId(channelId),
    })
    const isSubscribed = await Subscription.exists({
        subscriber: req.user._id,
        channel: mongoose.Types.ObjectId(channelId),
    });

    return res.status(200).json(
        new ApiResponse(200,{totalSubscribers, isSubscribed: !!isSubscribed},"Channel subscription info fetched Successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid User Id")
    }
    const userExists = await User.exists({_id:subscriberId})
    if(!userExists){
        throw new ApiError(404,"User does not exist")
    }
    const skip = (parseInt(page)-1) * parseInt(limit)
    const subscribedChannels = await Subscription.find({
        subscriber:subscriberId,
    }).populate("channel","username avatar coverImage subscribersCount").skip(skip)
    .limit(parseInt(limit))
    .sort({createdAt : -1}).lean()

    /* ALTERNATIVE METHOD AT MONGODB NATIVE LEVEL(For large datasets) -->
         const pipeline = [
        {
            $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
        },
        {
            $lookup: {
                from: "users", // collection name (always lowercase + plural)
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
            },
        },
        {
            $unwind: "$channelDetails", // converts array -> single object
        },
        {
            $project: {
                _id: 0,
                "channelDetails._id": 1,
                "channelDetails.username": 1,
                "channelDetails.avatar": 1,
                "channelDetails.coverImage": 1,
                "channelDetails.subscribersCount": 1,
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $skip: skip,
        },
        {
            $limit: limit,
        },
    ];

    const subscribedChannels = await Subscription.aggregate(pipeline);
    */

    if( !subscribedChannels || subscribedChannels.length === 0 ){
        throw new ApiError(404,"No channels subscribed")
    }
    const channelsList = subscribedChannels.map(sub => sub.channel);
    const totalChannelsSubscribed = await Subscription.countDocuments({
        subscriber:subscriberId,
    })
    const totalPages = Math.ceil(totalChannelsSubscribed/parseInt(limit));
    return res.status(200).json(
        new ApiResponse(200,{
            channelsList,
            pagination: {
                totalChannelsSubscribed,
                totalPages,
                currentPage: parseInt(page),
                pageSize: parseInt(limit),
            },
        },"Subscribed Channels fetched Successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
