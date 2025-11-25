import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import VideoDetail from './pages/VideoDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Channel from './pages/Channel';
import UploadVideo from './pages/UploadVideo';
import Search from './pages/Search';
import LikedVideos from './pages/LikedVideos';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="video/:videoId" element={<VideoDetail />} />
          <Route path="c/:username" element={<Channel />} />
import LikedVideos from './pages/LikedVideos';
import History from './pages/History';

// ... inside Routes
          <Route path="liked-videos" element={<LikedVideos />} />
          <Route path="history" element={<History />} />
          <Route path="upload" element={<UploadVideo />} />
          <Route path="search" element={<Search />} />
          {/* Add more routes here */}
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
