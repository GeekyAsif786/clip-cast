import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", required: true 
    },
    action: { 
        type: String, 
        required: true 
    },
    target: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Video" 
    },
    playlist: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Playlist" 
    },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
