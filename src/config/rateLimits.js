export const RATE_LIMITS = {
  publishAVideo: { normal: 3, premium: 10, window: 10 * 60 * 1000 },
  createTweet: { normal: 5, premium: 15, window: 5 * 60 * 1000 },
  toggleLike: { normal: 30, premium: 60, window: 1 * 60 * 1000 },
  comment: { normal: 10, premium: 30, window: 2 * 60 * 1000 },
};