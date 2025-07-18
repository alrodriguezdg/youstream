import os

# YouTube API Configuration
YOUTUBE_API_KEY = 'AIzaSyD0abX4a4P19KNuNaWHP2x9i-7hNuF3OIg'

# Database Configuration
DATABASE_URI = 'sqlite:///youstream.db' # Cambiar a la ruta de la base de datos

# Flask Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
DEBUG = True
PORT = 5001

# CORS Configuration
ALLOWED_ORIGINS = ["http://localhost:3000"] 