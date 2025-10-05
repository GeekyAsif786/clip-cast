import mongoose, { Schema } from "mongoose";


const likeSchema = new Schema({
    //there can be like in a comment so we add comment reference here
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    //there can be like in a video so we add video reference here
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    //the one who liked
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    //there can be like in a tweet so we add tweet reference here
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    },
},{timestamps:true})

export const Like = mongoose.model("Like", likeSchema)