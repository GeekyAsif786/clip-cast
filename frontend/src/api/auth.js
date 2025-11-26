import api from './axios';

export const registerUser = (data) => api.post('/users/register', data);
export const loginUser = (data) => api.post('/users/login', data);
export const logoutUser = () => api.post('/users/logout');
export const refreshAccessToken = () => api.post('/users/refresh-token');
export const changeCurrentPassword = (data) => api.post('/users/change-password', data);
export const getCurrentUser = () => api.get('/users/current-user');
export const updateAccountDetails = (data) => api.patch('/users/update-account', data);
export const updateUserAvatar = (data) => api.patch('/users/avatar', data);
export const updateUserCoverImage = (data) => api.patch('/users/cover-image', data);
export const getUserChannelProfile = (username) => api.get(`/users/c/${username}`);
export const getWatchHistory = () => api.get('/users/history');
