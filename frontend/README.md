# ClipCast Frontend

A modern, responsive YouTube clone frontend built with React and Vite. This application provides a full-featured video streaming experience with user authentication, video management, social interactions, and more.

## 🚀 Features

### Core Features

- **Video Streaming** - Watch videos with a custom video player
- **User Authentication** - Register, login, and manage user sessions
- **Video Upload** - Upload videos with thumbnails and metadata
- **Search & Discovery** - Search videos by title and description
- **Channel Management** - View and manage user channels with videos, playlists, and tweets

### Social Features

- **Likes & Dislikes** - Like videos and comments
- **Comments** - Add, view, and manage comments on videos
- **Subscriptions** - Subscribe to channels and track subscriptions
- **Watch History** - Track and view your watch history
- **Playlists** - Create and manage video playlists

### UI/UX Features

- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Dark Theme** - Modern dark-themed interface
- **Real-time Updates** - Instant UI updates for likes, subscriptions, and comments
- **Loading States** - Smooth loading indicators and skeletons
- **Error Handling** - Graceful error states and user feedback

## 🛠️ Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **Routing:** React Router DOM 7
- **HTTP Client:** Axios 1.13
- **Form Management:** React Hook Form 7
- **Icons:** React Icons 5
- **Language:** JavaScript (ES6+)

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/GeekyAsif786/clip-cast.git
   cd clip-cast/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   The frontend is pre-configured to proxy API requests to `http://localhost:8000`. If your backend runs on a different port, update `vite.config.js`:

   ```javascript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:YOUR_PORT',
         changeOrigin: true,
       },
     },
   },
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to `http://localhost:5173`

## 📜 Available Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start development server with hot reload |
| `npm run build`   | Build for production                     |
| `npm run preview` | Preview production build locally         |
| `npm run lint`    | Run ESLint to check code quality         |

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/                 # API service modules
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── video.js        # Video management endpoints
│   │   ├── comment.js      # Comment endpoints
│   │   ├── like.js         # Like/dislike endpoints
│   │   ├── subscription.js # Subscription endpoints
│   │   ├── playlist.js     # Playlist endpoints
│   │   ├── tweet.js        # Tweet endpoints
│   │   ├── dashboard.js    # Dashboard statistics
│   │   └── axios.js        # Axios instance configuration
│   │
│   ├── components/         # Reusable UI components
│   │   ├── Header.jsx      # Navigation header with search
│   │   ├── Sidebar.jsx     # Navigation sidebar
│   │   ├── VideoCard.jsx   # Video thumbnail card
│   │   ├── CommentSection.jsx # Comment display and input
│   │   └── Loader.jsx      # Loading spinner
│   │
│   ├── pages/              # Page components
│   │   ├── Home.jsx        # Video feed homepage
│   │   ├── VideoDetail.jsx # Video player page
│   │   ├── Login.jsx       # User login
│   │   ├── Register.jsx    # User registration
│   │   ├── Channel.jsx     # Channel profile
│   │   ├── UploadVideo.jsx # Video upload form
│   │   ├── Search.jsx      # Search results
│   │   ├── LikedVideos.jsx # Liked videos page
│   │   └── History.jsx     # Watch history
│   │
│   ├── context/            # React Context providers
│   │   └── AuthContext.jsx # Authentication state management
│   │
│   ├── utils/              # Utility functions
│   │   └── format.js       # Date/time formatting helpers
│   │
│   ├── App.jsx             # Main app component with routes
│   ├── Layout.jsx          # Layout wrapper with header/sidebar
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles and Tailwind imports
│
├── public/                 # Static assets
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── package.json           # Project dependencies and scripts
```

## 🔌 API Integration

The frontend communicates with the backend API using Axios. All API calls are centralized in the `src/api/` directory.

### Authentication Flow

1. User registers or logs in via `/login` or `/register`
2. Backend returns user data and sets HTTP-only cookies for authentication
3. `AuthContext` manages global authentication state
4. Protected routes check authentication status before rendering

### API Base Configuration

```javascript
// src/api/axios.js
const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});
```

## 🎨 Styling Guide

This project uses Tailwind CSS v4 for styling. Key design principles:

- **Dark Theme**: Primary background `#0f0f0f`, secondary `#1e1e1e`
- **Accent Color**: Blue `#3ea6ff` for interactive elements
- **Typography**: System fonts with clear hierarchy
- **Spacing**: Consistent use of Tailwind spacing utilities
- **Responsiveness**: Mobile-first approach with breakpoints

## 🔐 Authentication

The app uses cookie-based authentication:

- Access tokens and refresh tokens are stored in HTTP-only cookies
- `withCredentials: true` ensures cookies are sent with each request
- `AuthContext` provides global access to user state and auth functions

## 🚧 Known Issues & Limitations

- Video player does not support adaptive bitrate streaming
- No real-time notifications for new comments or likes
- Pagination is implemented but infinite scroll is not
- No offline support or PWA features

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the ClipCast YouTube clone. See the main repository for license information.

## 🔗 Related Links

- [Backend Repository](https://github.com/GeekyAsif786/clip-cast)
- [API Documentation](#) _(Add link when available)_
- [Design Mockups](#) _(Add link if available)_

---

**Built with ❤️ using React and Vite**
