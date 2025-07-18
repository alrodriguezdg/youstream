import React, { useState } from 'react';
import './assets/styles/App.scss';
import LoginForm from './components/LoginForm';

function App() {
  // Estado para saber si el usuario está autenticado
  // Se puede pasar un callback a LoginForm para actualizar este estado
  // Pero para mantenerlo simple, el fondo se aplicará solo si la ruta es login/register
  // Suponiendo que LoginForm internamente muestra RegisterForm
  return (
    <div className="app">
      <div className="app__auth-bg">
        <div className="app__container">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default App;
