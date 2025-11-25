import api from './axios';

export const toggleSubscription = (channelId) => api.post(`/subscriptions/c/${channelId}`);
export const getUserChannelSubscribers = (channelId) => api.get(`/subscriptions/c/${channelId}`);
export const getSubscribedChannels = (subscriberId) => api.get(`/subscriptions/u/${subscriberId}`);
