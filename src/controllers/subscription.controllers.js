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
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
