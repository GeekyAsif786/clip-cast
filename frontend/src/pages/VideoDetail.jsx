import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getVideoById } from '../api/video';
import { toggleVideoLike as toggleLikeApi } from '../api/like';
import { toggleSubscription as toggleSubApi } from '../api/subscription';
import Loader from '../components/Loader';
import { formatDuration, timeAgo } from '../utils/format';
import { BiLike, BiSolidLike, BiDislike, BiSolidDislike } from "react-icons/bi";
import { FaShare } from "react-icons/fa";
import CommentSection from '../components/CommentSection';

function VideoDetail() {
    const { videoId } = useParams();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const response = await getVideoById(videoId);
                setVideo(response.data.data);
                // Set initial like/subscribe state if available in response
                setIsLiked(response.data.data.isLiked);
                setIsSubscribed(response.data.data.isSubscribed);
            } catch (err) {
                console.error("Error fetching video:", err);
                setError("Failed to load video");
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [videoId]);

    const handleLike = async () => {
        try {
            await toggleLikeApi(videoId);
            setIsLiked(!isLiked);
            setVideo(prev => ({
                ...prev,
                likesCount: isLiked ? prev.likesCount - 1 : prev.likesCount + 1
            }));
        } catch (err) {
            console.error("Error toggling like:", err);
        }
    };

    const handleSubscribe = async () => {
        try {
            if (!video.owner?._id) {
                console.error("Owner ID is missing:", video.owner);
                return;
            }
            console.log("Subscribing to channel:", video.owner._id);
            await toggleSubApi(video.owner._id);
            setIsSubscribed(!isSubscribed);
            setVideo(prev => ({
                ...prev,
                owner: {
                    ...prev.owner,
                    subscribersCount: isSubscribed ? prev.owner.subscribersCount - 1 : prev.owner.subscribersCount + 1
                }
            }));
        } catch (err) {
            console.error("Error toggling subscription:", err);
        }
    };

    if (loading) return <Loader />;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;
    if (!video) return <div className="text-center text-gray-400 mt-10">Video not found</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                    <video 
                        src={video.videoFile} 
                        poster={video.thumbnail} 
                        controls 
                        autoPlay 
                        className="w-full h-full"
                    />
                </div>
                
                <h1 className="text-xl font-bold mt-4">{video.title}</h1>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img 
                                src={video.owner?.avatar || "https://via.placeholder.com/150"} 
                                alt={video.owner?.username} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold">{video.owner?.username}</h3>
                            <p className="text-xs text-gray-400">{video.owner?.subscribersCount || 0} subscribers</p>
                        </div>
                        <button 
                            onClick={handleSubscribe}
                            className={`px-4 py-2 rounded-full font-medium text-sm ${isSubscribed ? "bg-[#303030] text-white" : "bg-white text-black hover:bg-gray-200"}`}
                        >
                            {isSubscribed ? "Subscribed" : "Subscribe"}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-[#272727] rounded-full overflow-hidden">
                            <button 
                                onClick={handleLike}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-[#3f3f3f] border-r border-[#3f3f3f]"
                            >
                                {isLiked ? <BiSolidLike size={20} /> : <BiLike size={20} />}
                                <span>{video.likesCount || 0}</span>
                            </button>
                            <button className="px-4 py-2 hover:bg-[#3f3f3f]">
                                <BiDislike size={20} />
                            </button>
                        </div>
                        <button className="flex items-center gap-2 bg-[#272727] px-4 py-2 rounded-full hover:bg-[#3f3f3f]">
                            <FaShare />
                            <span>Share</span>
                        </button>
                    </div>
                </div>

                <div className="bg-[#272727] rounded-xl p-3 mt-4 text-sm">
                    <div className="flex gap-2 font-semibold mb-2">
                        <span>{video.views} views</span>
                        <span>{timeAgo(video.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{video.description}</p>
                </div>

                <CommentSection videoId={videoId} />
            </div>

            <div className="lg:w-[350px]">
                <h2 className="font-bold mb-4">Related Videos</h2>
                {/* Related videos list would go here */}
                <div className="flex flex-col gap-2">
                     {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-[#1e1e1e] h-24 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default VideoDetail;
