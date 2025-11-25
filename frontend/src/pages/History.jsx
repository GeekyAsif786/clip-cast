import React, { useEffect, useState } from 'react';
import { getWatchHistory } from '../api/auth';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';

function History() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await getWatchHistory();
                setVideos(response.data.data || []);
            } catch (err) {
                console.error("Error fetching watch history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Watch History</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((video) => (
                    <VideoCard key={video._id} video={video} />
                ))}
                {videos.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 mt-10">
                        No watch history found
                    </div>
                )}
            </div>
        </div>
    );
}

export default History;
