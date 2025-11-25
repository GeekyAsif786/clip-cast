import React, { useEffect, useState } from 'react';
import { getAllVideos } from '../api/video';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';

function Home() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await getAllVideos();
                // Assuming the API returns { data: { docs: [...] } } or similar
                // Adjust based on actual API response structure
                setVideos(response.data.data.videos || []); 
            } catch (err) {
                console.error("Error fetching videos:", err);
                setError("Failed to load videos");
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    if (loading) return <Loader />;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Recommended</h1>
            {videos.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">No videos found</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {videos.map((video) => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Home;
