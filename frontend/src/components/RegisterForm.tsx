import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/RegisterForm.scss';

interface RegisterResponse {
  success: boolean;
  message: string;
  user?: string;
}

interface EntertainmentTypesResponse {
  types: string[];
}

interface UsernameCheckResponse {
  available: boolean;
  message: string;
}

interface RegisterFormProps {
  onRegisterSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    entertainment_type: ''
  });
  const [entertainmentTypes, setEntertainmentTypes] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Cargar tipos de entretenimiento al montar el componente
  useEffect(() => {
    const loadEntertainmentTypes = async () => {
      try {
        const response = await axios.get<EntertainmentTypesResponse>('http://localhost:5001/entertainment-types');
        setEntertainmentTypes(response.data.types);
      } catch (error) {
        console.error('Error cargando tipos de entretenimiento:', error);
      }
    };
    loadEntertainmentTypes();
  }, []);

  // Verificar disponibilidad del username
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username.length >= 3) {
        try {
          const response = await axios.post<UsernameCheckResponse>('http://localhost:5001/check-username', {
            username: formData.username
          });
          setUsernameAvailable(response.data.available);
        } catch (error) {
          setUsernameAvailable(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores al escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    } else if (usernameAvailable === false) {
      newErrors.username = 'El nombre de usuario ya está en uso';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.entertainment_type) {
      newErrors.entertainment_type = 'Selecciona un tipo de entretenimiento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post<RegisterResponse>('http://localhost:5001/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        entertainment_type: formData.entertainment_type
      });

      if (response.data.success) {
        setMessage('¡Registro exitoso! Ya puedes iniciar sesión.');
        setFormData({
          name: '',
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
          entertainment_type: ''
        });
        setUsernameAvailable(null);
        // Llama a la función para volver al login tras un pequeño delay
        setTimeout(() => {
          if (onRegisterSuccess) onRegisterSuccess();
        }, 1200);
      } else {
        setMessage(response.data.message);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register">
      <h2 className="register__title">Crear Cuenta</h2>
      <form onSubmit={handleSubmit} className="register__form">
        <div className="register__form-group">
          <input
            type="text"
            name="name"
            placeholder="Nombre completo"
            value={formData.name}
            onChange={handleInputChange}
            className={`register__input${errors.name ? ' register__input--error' : ''}`}
          />
          {errors.name && <span className="register__error-message">{errors.name}</span>}
        </div>
        <div className="register__form-group">
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleInputChange}
            className={`register__input${errors.email ? ' register__input--error' : ''}`}
          />
          {errors.email && <span className="register__error-message">{errors.email}</span>}
        </div>
        <div className="register__form-group">
          <input
            type="text"
            name="username"
            placeholder="Nombre de usuario"
            value={formData.username}
            onChange={handleInputChange}
            className={`register__input${errors.username ? ' register__input--error' : ''} ${usernameAvailable === true ? 'register__input--available' : usernameAvailable === false ? 'register__input--unavailable' : ''}`}
          />
          {errors.username && <span className="register__error-message">{errors.username}</span>}
          {usernameAvailable === true && <span className="register__success-message">✓ Usuario disponible</span>}
          {usernameAvailable === false && <span className="register__error-message">✗ Usuario no disponible</span>}
        </div>
        <div className="register__form-group">
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleInputChange}
            className={`register__input${errors.password ? ' register__input--error' : ''}`}
          />
          {errors.password && <span className="register__error-message">{errors.password}</span>}
        </div>
        <div className="register__form-group">
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar contraseña"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`register__input${errors.confirmPassword ? ' register__input--error' : ''}`}
          />
          {errors.confirmPassword && <span className="register__error-message">{errors.confirmPassword}</span>}
        </div>
        <div className="register__form-group">
          <select
            name="entertainment_type"
            value={formData.entertainment_type}
            onChange={handleInputChange}
            className={`register__input${errors.entertainment_type ? ' register__input--error' : ''}`}
          >
            <option value="">Selecciona tu tipo de entretenimiento favorito</option>
            {entertainmentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.entertainment_type && <span className="register__error-message">{errors.entertainment_type}</span>}
        </div>
        <button type="submit" disabled={loading} className="register__button">
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
        {message && (
          <div className={`register__message${message.includes('exitoso') ? ' register__message--success' : ' register__message--error'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default RegisterForm; 