import api from './axios';

export const toggleVideoLike = (videoId) => api.post(`/likes/toggle/v/${videoId}`);
export const toggleCommentLike = (commentId) => api.post(`/likes/toggle/c/${commentId}`);
export const toggleTweetLike = (tweetId) => api.post(`/likes/toggle/t/${tweetId}`);
export const getLikedVideos = () => api.get('/likes/getlikedvideos');
