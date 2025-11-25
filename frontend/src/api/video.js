import api from './axios';

export const getAllVideos = (params) => api.get('/videos', { params });
export const getVideoById = (videoId) => api.get(`/videos/id/${videoId}`);
export const publishVideo = (data) => api.post('/videos', data);
export const updateVideo = (videoId, data) => api.patch(`/videos/${videoId}`, data);
export const deleteVideo = (videoId) => api.delete(`/videos/${videoId}`);
export const togglePublishStatus = (videoId) => api.patch(`/videos/toggle/publish/${videoId}`);
