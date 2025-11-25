import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    //baseURL:`https://clip-cast-backend.vercel.app/api/v1`,
    withCredentials: true,
});

export default api;
