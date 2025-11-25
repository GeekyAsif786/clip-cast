import React, { useEffect, useState } from 'react';
import { getVideoComments, addComment } from '../api/comment';
import { timeAgo } from '../utils/format';

function CommentSection({ videoId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await getVideoComments(videoId);
                setComments(response.data.data.comments || []);
            } catch (err) {
                console.error("Error fetching comments:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [videoId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await addComment(videoId, newComment);
            setComments([response.data.data, ...comments]);
            setNewComment("");
        } catch (err) {
            console.error("Error adding comment:", err);
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">{comments.length} Comments</h3>
            
            <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-gray-600 shrink-0"></div>
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Add a comment..." 
                        className="w-full bg-transparent border-b border-[#303030] focus:border-white focus:outline-none pb-1 text-white"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                        <button 
                            type="submit" 
                            disabled={!newComment.trim()}
                            className="bg-[#3ea6ff] text-black px-4 py-2 rounded-full font-medium text-sm disabled:bg-[#272727] disabled:text-gray-500"
                        >
                            Comment
                        </button>
                    </div>
                </div>
            </form>

            <div className="flex flex-col gap-4">
                {comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                            <img 
                                src={comment.owner?.avatar || "https://via.placeholder.com/150"} 
                                alt={comment.owner?.username} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">@{comment.owner?.username}</span>
                                <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CommentSection;
