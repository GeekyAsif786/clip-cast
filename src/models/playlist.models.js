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
        type:String,
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
    isDeleted: {
    type: Boolean,
    default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
},{timestamps:true})

//Pre-query middleware (soft delete filter)
playlistSchema.pre(/^find/, function(next) {
    if (!this.getFilter().includeDeleted) {
        this.where({ isDeleted: false });
    }
    next();
});

//pre-aggregate hook (if you use aggregations)
playlistSchema.pre("aggregate", function(next) {
    const matchStage = { $match: { isDeleted: false } };
    this.pipeline().unshift(matchStage);
    next();
});

export const Playlist = mongoose.model("Playlist",playlistSchema)


