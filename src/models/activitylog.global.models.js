import mongoose, { Schema } from "mongoose";

const activityLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., "UPDATE_TWEET"
    target: { type: Schema.Types.ObjectId, refPath: "targetModel" },
    targetModel: { type: String, required: true, enum: ["Tweet", "Video", "Playlist"] },
    metadata: { type: Object }, // optional: store extra info (e.g. old vs new content)
  },
  { timestamps: true }
);
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ target: 1, targetModel: 1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days
export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
