import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './Dashboard';
import RegisterForm from './RegisterForm';
import '../assets/styles/LoginForm.scss';
import logo from '../assets/img/logo-youstream-02.svg';

interface LoginResponse {
success: boolean;
message: string;
user?: string;
entertainment_type?: string;
}

const LoginForm: React.FC = () => {
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [message, setMessage] = useState('');
const [loading, setLoading] = useState(false);
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [currentUser, setCurrentUser] = useState('');
const [userInterest, setUserInterest] = useState<string | null>(null);
const [showRegister, setShowRegister] = useState(false);
const [videosLoaded, setVideosLoaded] = useState(false);
const [showLoader, setShowLoader] = useState(false);
const [loaderFade, setLoaderFade] = useState(false);

// Mostrar loader al iniciar sesión
useEffect(() => {
  if (isLoggedIn) {
    setShowLoader(true);
    setLoaderFade(false);
  }
}, [isLoggedIn]);

// Cuando los videos terminen de cargar, activar fadeout y ocultar tras animación
useEffect(() => {
  if (isLoggedIn && videosLoaded && showLoader) {
    setLoaderFade(true);
    const timeout = setTimeout(() => setShowLoader(false), 600); // 600ms igual que el CSS
    return () => clearTimeout(timeout);
  }
}, [isLoggedIn, videosLoaded, showLoader]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage('');
  try {
    const response = await axios.post<LoginResponse>('http://localhost:5001/login', {
      username,
      password,
    });
    if (response.data.success) {
      setCurrentUser(response.data.user || '');
      setUserInterest(response.data.entertainment_type || null);
      setIsLoggedIn(true);
      setMessage('Login exitoso. ¡Bienvenido ' + response.data.user + '!');
    } else {
      setMessage(response.data.message || 'Error desconocido');
    }
  } catch (error: any) {
    setMessage(error.response?.data?.message || 'Error de conexión');
  } finally {
    setLoading(false);
  }
};

const handleLogout = () => {
  setIsLoggedIn(false);
  setCurrentUser('');
  setUserInterest(null);
  setUsername('');
  setPassword('');
  setMessage('');
};

const toggleForm = () => {
  setShowRegister(!showRegister);
  setMessage('');
  setUsername('');
  setPassword('');
};

if (loading) {
  return (
    <div className="login__loader-overlay">
      <div className="login__loader">
        <img src={logo} alt="Cargando..." className="login__loader-img" />
      </div>
    </div>
  );
}

if (isLoggedIn && showLoader) {
  return (
    <div className={`login__loader-overlay${loaderFade ? ' login__loader-overlay--fadeout' : ''}`}>
      <div className="login__loader">
        <img src={logo} alt="Cargando..." className="login__loader-img" />
      </div>
    </div>
  );
}

if (isLoggedIn) {
  // Loader ya se maneja arriba con showLoader y loaderFade
  return (
    <div className="login__dashboard-wrapper">
      <div className="login__dashboard-header">
        <h2 className="login__dashboard-title">
          <div className="login__dashboard-logo">
            <img src={logo} alt="Logo" />
          </div>
        </h2>
        <button onClick={handleLogout} className="login__logout-button">Cerrar Sesión</button>
      </div>
      <Dashboard userInterest={userInterest} onVideosLoaded={() => setVideosLoaded(true)} currentUser={currentUser} />
    </div>
  );
}

if (showRegister) {
  return (
    <div className="login__register-wrapper">
      <RegisterForm onRegisterSuccess={toggleForm} />
      <div className="login__toggle">
        <p className="login__toggle-text">
          ¿Ya tienes cuenta?{' '}
          <button onClick={toggleForm} className="login__toggle-button">Inicia sesión aquí</button>
        </p>
      </div>
    </div>
  );
}

return (
  <div className="login">
    <div className="app__logo">
        <img src={logo} alt="Logo" />
    </div>
    <div className='login__form-wrapper'>
      <form onSubmit={handleSubmit} className="login__form">
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          className="login__input"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="login__input"
        />
        <button type="submit" disabled={loading} className="login__button">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
        {message && <div className="login__message">{message}</div>}
      </form>
      <div className="login__toggle">
        <p className="login__toggle-text">
          ¿No tienes cuenta?{' '}
          <button onClick={toggleForm} className="login__toggle-button">Regístrate aquí</button>
        </p>
      </div>
    </div>
  </div>
);
};

export default LoginForm; 