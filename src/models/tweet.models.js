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
    media:{
        type: String,
    },
    likeCount:{
        type:Number,
        default:0
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    editedAt: {
        type: Date,
        default: null,
    },
},{timestamps:true})

//Pre-query middleware (soft delete filter)
tweetSchema.pre(/^find/, function(next) {
    if (!this.getFilter().includeDeleted) {
        this.where({ isDeleted: false });
    }
    next();
});

//pre-aggregate hook (if you use aggregations)
tweetSchema.pre("aggregate", function(next) {
    const matchStage = { $match: { isDeleted: false } };
    this.pipeline().unshift(matchStage);
    next();
});

tweetSchema.index({ owner: 1, isDeleted: 1, createdAt: -1 });
export const Tweet = mongoose.model("Tweet",tweetSchema)