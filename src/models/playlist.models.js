import mongoose, { Schema } from "mongoose";


const playlistSchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        index:true,
    },
    description:{
        type:true,
        required:false,
        trim:true,
    },
    //array of videos
    videos:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video",
        }
    ],
    //owner of the playlist
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    visibility:{
        type:String,
        enum: ["private","public","unlisted"],
        default:"private",
    },
},{timestamps:true})

export const Playlist = mongoose.model("Playlist",playlistSchema)


