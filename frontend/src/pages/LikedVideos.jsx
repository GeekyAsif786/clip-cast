import React, { useEffect, useState } from 'react';
import { getLikedVideos } from '../api/like';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';

function LikedVideos() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLikedVideos = async () => {
            try {
                const response = await getLikedVideos();
                setVideos(response.data.data.likedVideos || []);
            } catch (err) {
                console.error("Error fetching liked videos:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLikedVideos();
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Liked Videos</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((video) => (
                    <VideoCard key={video._id} video={video} />
                ))}
                {videos.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 mt-10">
                        No liked videos found
                    </div>
                )}
            </div>
        </div>
    );
}

export default LikedVideos;
