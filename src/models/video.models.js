import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema({
    videoFile:{
        type: String, //Cloudinary Url
        required: true,
    },
    thumbnail: {
        type:String, //Cloudinary Url
        required: true,
    },
    title: {
        type:String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type:Boolean,
        default: false,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    likeCount:{
        type:Number,
        default:0
    },
    commentCount:{
        type:Number,
        default:0,
    },
},{timestamps:true})


videoSchema.plugin(mongooseAggregatePaginate);
videoSchema.index({ owner: 1, views: -1 });


export const Video = mongoose.model("Video", videoSchema)