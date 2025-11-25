import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllVideos } from '../api/video';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';

function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query');
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            try {
                // Assuming getAllVideos supports a search query param, e.g., ?query=... or ?search=...
                // Based on video.routes.js: router.route("/").get(getVideoBySearch)
                // And getVideoBySearch controller likely uses req.query
                const response = await getAllVideos({ query }); 
                setVideos(response.data.data.videos || []);
            } catch (err) {
                console.error("Error searching videos:", err);
            } finally {
                setLoading(false);
            }
        };

        if (query) {
            fetchVideos();
        }
    }, [query]);

    if (loading) return <Loader />;

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Search Results for "{query}"</h2>
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

export default Search;
