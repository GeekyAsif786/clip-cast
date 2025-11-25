import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, timeAgo } from '../utils/format';

function VideoCard({ video }) {
    return (
        <Link to={`/video/${video._id}`} className="flex flex-col gap-2 group">
            <div className="relative aspect-video rounded-xl overflow-hidden">
                <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {formatDuration(video.duration)}
                </span>
            </div>
            <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                        src={video.owner?.avatar || "https://via.placeholder.com/150"} 
                        alt={video.owner?.username} 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-white font-semibold line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                        {video.title}
                    </h3>
                    <span className="text-[#aaaaaa] text-sm mt-1 hover:text-white transition-colors">
                        {video.owner?.username}
                    </span>
                    <div className="text-[#aaaaaa] text-sm flex items-center gap-1">
                        <span>{video.views} views</span>
                        <span className="text-[10px]">•</span>
                        <span>{timeAgo(video.createdAt)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default VideoCard;
