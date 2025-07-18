import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/Dashboard.scss';

interface Video {
id: string;
title: string;
channel: string;
thumbnail: string;
duration: string;
views: string;
publishedAt: string;
description: string;
}

interface Category {
id: string;
title: string;
}

// API Response interfaces
interface ApiResponse<T> {
success: boolean;
message?: string;
}

interface CategoriesResponse extends ApiResponse<Category[]> {
categories: Category[];
}

interface VideosResponse extends ApiResponse<Video[]> {
videos: Video[];
}

interface DashboardProps {
userInterest?: string | null;
onVideosLoaded?: () => void;
currentUser?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userInterest, onVideosLoaded, currentUser }) => {
const [videos, setVideos] = useState<Video[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [apiMessage, setApiMessage] = useState('');
const [searchQuery, setSearchQuery] = useState('');

const API_BASE_URL = 'http://localhost:5001';

useEffect(() => {
// Si hay interés del usuario, buscar videos relacionados
if (userInterest && userInterest.trim() !== '') {
setSearchQuery(userInterest);
searchVideos(userInterest);
} else {
loadPopularVideos();
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [userInterest]);

const loadPopularVideos = async () => {
setLoading(true);
setError('');
setApiMessage('');
try {
const response = await axios.get<VideosResponse>(`${API_BASE_URL}/api/videos/popular`, {
params: {
maxResults: 20
}
});

if (response.data.success) {
setVideos(response.data.videos);
setApiMessage(response.data.message || '');
if (onVideosLoaded) onVideosLoaded();
} else {
setError('Error loading videos');
if (onVideosLoaded) onVideosLoaded();
}
} catch (error) {
console.error('Error loading popular videos:', error);
setError('Error loading videos. Please check your YouTube API key.');
if (onVideosLoaded) onVideosLoaded();
} finally {
setLoading(false);
}
};

const searchVideos = async (query: string) => {
if (!query.trim()) {
loadPopularVideos();
return;
}

setLoading(true);
setError('');
try {
const response = await axios.get<VideosResponse>(`${API_BASE_URL}/api/videos/search`, {
params: {
q: query,
maxResults: 20
}
});

if (response.data.success) {
setVideos(response.data.videos);
if (onVideosLoaded) onVideosLoaded();
} else {
setError('Error searching videos');
if (onVideosLoaded) onVideosLoaded();
}
} catch (error) {
console.error('Error searching videos:', error);
setError('Error searching videos. Please check your YouTube API key.');
if (onVideosLoaded) onVideosLoaded();
} finally {
setLoading(false);
}
};

const handleSearch = (e: React.FormEvent) => {
e.preventDefault();
searchVideos(searchQuery);
};

const formatDate = (dateString: string) => {
const date = new Date(dateString);
const now = new Date();
const diffTime = Math.abs(now.getTime() - date.getTime());
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

if (diffDays === 1) return 'Hoy';
if (diffDays <= 7) return `Hace ${diffDays} días`;
if (diffDays <= 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
if (diffDays <= 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
return `Hace ${Math.floor(diffDays / 365)} años`;
};

return (
<div className="dashboard">
<div className="dashboard__header">
<h1>Bienvenido {currentUser}</h1>
<p>Descubre los mejores videos de YouTube</p>

</div>

<div className="dashboard__search">
<form onSubmit={handleSearch} className="dashboard__search-form">
<input
  type="text"
  placeholder="Buscar videos..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="dashboard__search-input"
/>
<button type="submit" className="dashboard__search-button">
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px', verticalAlign: 'middle'}}>
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" />
    <line x1="14.4142" y1="14" x2="18" y2="17.5858" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
  <span>Buscar</span>
</button>
</form>
</div>

{error && (
<div className="dashboard__error">
<p>{error}</p>
<p>Para usar la API de YouTube, necesitas configurar una API key en el backend.</p>
</div>
)}
{userInterest && (
<div className="dashboard__user-interest">
<p>
  Mostrando videos de: <b>{userInterest}</b>
</p>
</div>
)}


<div className="dashboard__grid">
{loading && (
<div className="dashboard__loading">
<p>Cargando videos...</p>
</div>
)}

{videos.map((video) => (
<div key={video.id} className="dashboard__video-card">
  <div className="dashboard__video-card-thumbnail">
    <img
      src={video.thumbnail}
      alt={video.title}
    />
    <div className="dashboard__video-card-thumbnail-duration">
      {video.duration}
    </div>
  </div>
  
  <div className="dashboard__video-card-content">
    <div className="dashboard__video-card-header">
      <p className="dashboard__video-card-channel">{video.channel}</p>
      <h3>{video.title}</h3>              
    </div>
    <p className="dashboard__video-card-description">{video.description}</p>
    <div className="dashboard__video-card-meta">
      <span>{video.views} visualizaciones</span>
      <span>{formatDate(video.publishedAt)}</span>
    </div>
  </div>
</div>
))}
</div>

{videos.length === 0 && !loading && !error && (
<div className="dashboard__empty">
<p>{apiMessage || 'No se encontraron videos. Intenta con otra búsqueda o categoría.'}</p>
</div>
)}
</div>
);
};

export default Dashboard; 