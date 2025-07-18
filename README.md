# YouStream

YouStream is a fullstack web application that allows users to register, log in, and discover/search YouTube videos based on their interests. The project features a Flask backend and a React (TypeScript) frontend, with a modern UI, BEM methodology, and Montserrat font.

---

## Features
- User registration and login (with hashed passwords)
- Personalized dashboard with YouTube video recommendations
- Search and filter YouTube videos by interest
- Responsive, modern UI (BEM, SCSS, Montserrat)
- Custom favicon and branding
- Secure API key management for YouTube Data API

---

## Tech Stack
- **Frontend:** React (TypeScript), SCSS, BEM, Montserrat
- **Backend:** Flask, SQLAlchemy, YouTube Data API v3
- **Database:** SQLite (default, can be changed)

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/tu-usuario/youstream.git
cd youstream
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

- Configure your YouTube API key in `backend/config.py` or as an environment variable:
  ```bash
  export YOUTUBE_API_KEY="tu-api-key"
  ```
- Start the backend:
  ```bash
  python app.py
  ```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## Environment & Configuration
- **YouTube API Key:** Required for video search. See `backend/README_YOUTUBE_API.md` for setup instructions.
- **.env:** Use `.env` files to store secrets (see `.gitignore`).

---

## Project Structure
```
youstream/
  backend/      # Flask API, database, YouTube integration
  frontend/     # React app, SCSS, assets
```

---

## Customization
- **Branding:** Uses custom favicon (`favicon-youstream.png`) and logo.
- **Font:** Uses [Montserrat](https://fonts.google.com/specimen/Montserrat) for a modern look.
- **BEM:** All CSS classes follow the BEM methodology for maintainability.

---

## License
MIT

---

## Author
Alejandro Rodríguez