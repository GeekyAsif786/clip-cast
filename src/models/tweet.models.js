import mongoose, { Schema } from "mongoose";


const tweetSchema = new Schema({
    //owner of the tweet
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    content:{
        type:String,
        required:[true,"Tweet text is required"],
    },
},{timestamps:true})

export const Tweet = mongoose.model("Tweet",tweetSchema)