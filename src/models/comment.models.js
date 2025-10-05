import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const commentSchema = new Schema({
    content:{
        type:String,
        required:[true,"Comment text is required"],
        maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    //only a single video to comment in
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video",
    },
    //the one who commented
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
},{timestamps:true})

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment",commentSchema)