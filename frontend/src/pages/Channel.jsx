import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserChannelProfile } from '../api/auth';
import { getUserTweets } from '../api/tweet';
import { getUserPlaylists } from '../api/playlist';
import { getAllVideos } from '../api/video'; // Need a way to get user videos, maybe getAllVideos with userId param if supported
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import { toggleSubscription } from '../api/subscription';

function Channel() {
    const { username } = useParams();
    const [channel, setChannel] = useState(null);
    const [activeTab, setActiveTab] = useState('videos');
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const fetchChannel = async () => {
            try {
                const response = await getUserChannelProfile(username);
                setChannel(response.data.data);
                setIsSubscribed(response.data.data.isSubscribed);
            } catch (err) {
                console.error("Error fetching channel:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchChannel();
    }, [username]);

    useEffect(() => {
        const fetchContent = async () => {
            if (!channel) return;
            try {
                let response;
                if (activeTab === 'videos') {
                    // Assuming getAllVideos supports userId filter or we need a specific endpoint
                    // For now, let's assume we have an endpoint or use dashboard videos if it's own channel
                    // But for public channel, we might need a specific endpoint.
                    // Let's assume getAllVideos takes userId as query param
                    response = await getAllVideos({ userId: channel._id }); 
                } else if (activeTab === 'tweets') {
                    response = await getUserTweets(channel._id);
                } else if (activeTab === 'playlists') {
                    response = await getUserPlaylists(channel._id);
                }
                
                if (response) {
                    const data = response.data.data;
                    if (activeTab === 'videos') {
                        setContent(data.videos || []);
                    } else if (activeTab === 'tweets') {
                        setContent(data.uploadedTweets || data.tweets || []);
                    } else if (activeTab === 'playlists') {
                        setContent(Array.isArray(data) ? data : (data.playlists || []));
                    }
                }
            } catch (err) {
                console.error(`Error fetching ${activeTab}:`, err);
            }
        };

        if (channel) {
            fetchContent();
        }
    }, [activeTab, channel]);

    const handleSubscribe = async () => {
        try {
            await toggleSubscription(channel._id);
            setIsSubscribed(!isSubscribed);
        } catch (err) {
            console.error("Error toggling subscription:", err);
        }
    };

    if (loading) return <Loader />;
    if (!channel) return <div className="text-center text-gray-400 mt-10">Channel not found</div>;

    return (
        <div>
            {/* Cover Image */}
            <div className="h-32 sm:h-48 w-full bg-gray-800 overflow-hidden rounded-xl mb-6">
                {channel.coverImage ? (
                    <img src={channel.coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">No Cover Image</div>
                )}
            </div>

            {/* Channel Info */}
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-8 px-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#0f0f0f] -mt-16 sm:-mt-20">
                    <img src={channel.avatar} alt={channel.username} className="w-full h-full object-cover bg-gray-700" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{channel.fullName}</h1>
                    <div className="text-gray-400 text-sm flex flex-col gap-1 mt-1">
                        <span>@{channel.username}</span>
                        <span>{channel.subscribersCount} subscribers • {channel.channelsSubscribedToCount} subscribed</span>
                    </div>
                    <div className="mt-4">
                        <button 
                            onClick={handleSubscribe}
                            className={`px-6 py-2 rounded-full font-medium ${isSubscribed ? "bg-[#303030] text-white" : "bg-white text-black hover:bg-gray-200"}`}
                        >
                            {isSubscribed ? "Subscribed" : "Subscribe"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#303030] mb-6">
                <div className="flex gap-8">
                    {['videos', 'playlists', 'tweets'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-2 font-medium capitalize ${activeTab === tab ? "text-white border-b-2 border-white" : "text-gray-400 hover:text-white"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeTab === 'videos' && content.map((video) => (
                    <VideoCard key={video._id} video={video} />
                ))}
                {activeTab === 'playlists' && content.map((playlist) => (
                    <div key={playlist._id} className="bg-[#1e1e1e] p-4 rounded-xl">
                        <h3 className="font-bold">{playlist.name}</h3>
                        <p className="text-sm text-gray-400">{playlist.description}</p>
                    </div>
                ))}
                {activeTab === 'tweets' && content.map((tweet) => (
                    <div key={tweet._id} className="bg-[#1e1e1e] p-4 rounded-xl col-span-full">
                        <p>{tweet.content}</p>
                        <span className="text-xs text-gray-500 mt-2 block">{new Date(tweet.createdAt).toLocaleDateString()}</span>
                    </div>
                ))}
                {content.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-10">
                        No {activeTab} found
                    </div>
                )}
            </div>
        </div>
    );
}

export default Channel;
