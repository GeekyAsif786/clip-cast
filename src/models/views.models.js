import mongoose, { Schema } from "mongoose";

const videoViewSchema = new Schema(
  {
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    viewer: { type: Schema.Types.ObjectId, ref: "User", default: null }, // null for guests
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

videoViewSchema.index({ video: 1, viewer: 1, viewedAt: -1 });
videoViewSchema.index({ video: 1, ip: 1, userAgent: 1, viewedAt: -1 });

export const VideoView = mongoose.model("VideoView", videoViewSchema);
