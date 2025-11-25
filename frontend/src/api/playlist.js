import api from './axios';

export const createPlaylist = (data) => api.post('/playlist', data);
export const getPlaylistById = (playlistId) => api.get(`/playlist/${playlistId}`);
export const updatePlaylist = (playlistId, data) => api.patch(`/playlist/${playlistId}`, data);
export const deletePlaylist = (playlistId) => api.delete(`/playlist/${playlistId}`);
export const addVideoToPlaylist = (videoId, playlistId) => api.patch(`/playlist/add/${videoId}/${playlistId}`);
export const removeVideoFromPlaylist = (videoId, playlistId) => api.patch(`/playlist/remove/${videoId}/${playlistId}`);
export const getUserPlaylists = (userId) => api.get(`/playlist/user/${userId}`);
export const togglePlaylistVisibility = (playlistId) => api.patch(`/playlist/${playlistId}/visibility`);
