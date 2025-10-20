import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,  //One who is subscribing
        ref:"User"
    },  
    channel:{
        type:Schema.Types.ObjectId, //One to whom subscriber is subscribing
        ref:"User"
    }
},{timestamps:true});

// Compound index to prevent duplicate subscriptions
subscriptionSchema.index(
  { subscriber: 1, channel: 1 },
  { unique: true }
);

//Indexes on individual fields for faster lookups
subscriptionSchema.index({ subscriber: 1 });
subscriptionSchema.index({ channel: 1 });


export const Subscription = mongoose.model("Subscription", subscriptionSchema)