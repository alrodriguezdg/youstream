from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from googleapiclient.discovery import build
import os
import re
import traceback
from config import YOUTUBE_API_KEY, DATABASE_URI, SECRET_KEY, DEBUG, PORT, ALLOWED_ORIGINS
from googleapiclient.errors import HttpError

app = Flask(__name__)
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# Configuración de la base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = SECRET_KEY
db = SQLAlchemy(app)

# YouTube API Configuration
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

# Modelo de Usuario
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    entertainment_type = db.Column(db.String(50), nullable=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Crear las tablas
with app.app_context():
    try:
        db.create_all()
        print("Base de datos creada exitosamente")
    except Exception as e:
        print(f"Error creando la base de datos: {e}")

# Usuario de ejemplo (para compatibilidad)
USERS = {
    "testuser": "testpassword"
}

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validar campos requeridos
    required_fields = ['name', 'email', 'username', 'password', 'entertainment_type']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'success': False, 'message': f'El campo {field} es requerido'}), 400
    name = data.get('name').strip()
    email = data.get('email').strip().lower()
    username = data.get('username').strip()
    password = data.get('password')
    entertainment_type = data.get('entertainment_type')
    
    # Validar email
    if not is_valid_email(email):
        return jsonify({'success': False, 'message': 'Formato de email inválido'}), 400
    # Validar longitud de contraseña
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'La contraseña debe tener al menos 6 caracteres'}), 400
    # Verificar si el email ya existe
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'El email ya está registrado'}), 400
    # Verificar si el username ya existe
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'El nombre de usuario ya está en uso'}), 400
    # Crear nuevo usuario
    try:
        new_user = User(
            name=name,
            email=email,
            username=username,
            entertainment_type=entertainment_type
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'user': username
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en registro: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': f'Error al registrar usuario: {str(e)}'}), 500

@app.route('/check-username', methods=['POST'])
def check_username():
    data = request.get_json()
    username = data.get('username', '').strip()
    
    if not username:
        return jsonify({'available': False, 'message': 'Nombre de usuario requerido'}), 400
    user = User.query.filter_by(username=username).first()
    available = user is None
    
    return jsonify({
        'available': available,
        'message': 'Nombre de usuario disponible' if available else 'Nombre de usuario ya está en uso'
    }), 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'success': False, 'message': 'Usuario y contraseña son requeridos'}), 400

    # Primero buscar en la base de datos
    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password):
        return jsonify({
            'success': True,
            'message': 'Login exitoso',
            'user': username,
            'entertainment_type': user.entertainment_type
        }), 200
    # Si no está en la BD, verificar en usuarios de ejemplo (para compatibilidad)
    if USERS.get(username) == password:
        return jsonify({
            'success': True,
            'message': 'Login exitoso',
            'user': username,
            'entertainment_type': 'Programación y Tecnología'  # valor por defecto para usuarios de ejemplo
        }), 200
    else:
        return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401

@app.route('/entertainment-types', methods=['GET'])
def get_entertainment_types():
    entertainment_types = [
        'Programación y Tecnología',
        'Gaming',
        'Música',
        'Películas y Series',
        'Deportes',
        'Cocina',
        'Viajes',
        'Educación',
        'Comedia',
        'Documentales'
    ]
    return jsonify({'types': entertainment_types}), 200

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'Backend funcionando correctamente'}), 200

@app.route('/api/videos/search', methods=['GET'])
def search_videos():
    try:
        query = request.args.get('q', '')
        max_results = request.args.get('maxResults', 20, type=int)
        
        if not query:
            return jsonify({'success': False, 'message': 'Query parameter is required'}), 400
        
        # Search videos using YouTube API
        search_response = youtube.search().list(
            q=query,
            part='id,snippet',
            maxResults=max_results,
            type='video',
            order='relevance'
        ).execute()
        
        video_ids = [item['id']['videoId'] for item in search_response['items']]
        
        if not video_ids:
            return jsonify({'success': True, 'videos': []}), 200
        
        # Get detailed video information
        videos_response = youtube.videos().list(
            part='snippet,statistics,contentDetails',
            id=','.join(video_ids)
        ).execute()
        
        videos = []
        for video in videos_response['items']:
            snippet = video['snippet']
            statistics = video['statistics']
            content_details = video['contentDetails']
            
            # Format duration (PT4M13S -> 4:13)
            duration = content_details['duration']
            duration = duration.replace('PT', '').replace('H', ':').replace('M', ':').replace('S', '')
            
            # Format view count
            view_count = int(statistics.get('viewCount', 0))
            if view_count >= 1000000:
                views = f"{view_count // 1000000}M"
            elif view_count >= 1000:
                views = f"{view_count // 1000}K"
            else:
                views = str(view_count)
            
            videos.append({
                'id': video['id'],
                'title': snippet['title'],
                'channel': snippet['channelTitle'],
                'thumbnail': snippet['thumbnails']['medium']['url'],
                'duration': duration,
                'views': views,
                'publishedAt': snippet['publishedAt'],
                'description': snippet['description'][:100] + '...' if len(snippet['description']) > 100 else snippet['description']
            })
        
        return jsonify({'success': True, 'videos': videos}), 200
        
    except Exception as e:
        print(f"Error searching videos: {str(e)}")
        return jsonify({'success': False, 'message': 'Error searching videos'}), 500

@app.route('/api/videos/popular', methods=['GET'])
def get_popular_videos():
    try:
        max_results = request.args.get('maxResults', 20, type=int)
        category_id = request.args.get('categoryId', '28')  # Science & Technology by default
        
        # Get popular videos
        videos_response = youtube.videos().list(
            part='snippet,statistics,contentDetails',
            chart='mostPopular',
            regionCode='ES',
            videoCategoryId=category_id,
            maxResults=max_results
        ).execute()
        
        videos = []
        for video in videos_response['items']:
            snippet = video['snippet']
            statistics = video['statistics']
            content_details = video['contentDetails']
            
            # Format duration
            duration = content_details['duration']
            duration = duration.replace('PT', '').replace('H', ':').replace('M', ':').replace('S', '')
            
            # Format view count
            view_count = int(statistics.get('viewCount', 0))
            if view_count >= 1000000:
                views = f"{view_count // 1000000}M"
            elif view_count >= 1000:
                views = f"{view_count // 1000}K"
            else:
                views = str(view_count)
            
            videos.append({
                'id': video['id'],
                'title': snippet['title'],
                'channel': snippet['channelTitle'],
                'thumbnail': snippet['thumbnails']['medium']['url'],
                'duration': duration,
                'views': views,
                'publishedAt': snippet['publishedAt'],
                'description': snippet['description'][:100] + '...' if len(snippet['description']) > 100 else snippet['description']
            })
        
        return jsonify({'success': True, 'videos': videos}), 200
        
    except HttpError as e:
        if e.resp.status == 400 and "videoChartNotFound" in str(e):
            return jsonify({'success': True, 'videos': [], 'message': 'No hay videos populares en esta categoría.'}), 200
        print(f"Error getting popular videos: {str(e)}")
        return jsonify({'success': False, 'message': 'Error getting popular videos'}), 500
    except Exception as e:
        print(f"Error getting popular videos: {str(e)}")
        return jsonify({'success': False, 'message': 'Error getting popular videos'}), 500

@app.route('/api/videos/categories', methods=['GET'])
def get_video_categories():
    try:
        categories_response = youtube.videoCategories().list(
            part='snippet',
            regionCode='ES'
        ).execute()
        
        categories = []
        for category in categories_response['items']:
            categories.append({
                'id': category['id'],
                'title': category['snippet']['title']
            })
        
        return jsonify({'success': True, 'categories': categories}), 200
        
    except Exception as e:
        print(f"Error getting categories: {str(e)}")
        return jsonify({'success': False, 'message': 'Error getting categories'}), 500

if __name__ == '__main__':
    app.run(debug=DEBUG, port=PORT)