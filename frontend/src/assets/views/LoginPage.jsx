import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import welcomeImage from '../img/AlumceLogo.jpg';

const LoginPage = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const API = import.meta.env.VITE_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

  try {
    const res = await axios.post(`${API}api/login`, { correo, contrasena });
    login(res.data);
    navigate('/');
  } catch (err) {
    console.error('Error de login:', err);
    setError('Correo o contraseña incorrectos');
  }
};

  return (
    <section className="bg-primary py-4 py-md-5 py-xl-8 min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row align-items-center g-4">
          {/* Columna Izquierda (Imagen + texto) */}
          <div className="col-md-6 text-white d-flex flex-column justify-content-center align-items-center text-center">
            <img
              src={welcomeImage}
              alt="Bienvenida Alumce"
              className="img-fluid rounded mb-4 shadow"
              style={{ maxWidth: '300px' }}
            />
            <hr className="border-light mb-4" />
            <h2 className="h1 mb-3">Bienvenido a Alumce Control System</h2>
            <p className="lead">
              Sistema integral de gestión para producción, inventario y administración.
            </p>
          </div>

          {/* Columna Derecha (Login Card) */}
          <div className="col-md-6">
            <div className="card shadow rounded-4">
              <div className="card-body p-4 p-md-5">
                <h3 className="mb-4">Iniciar Sesión</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleLogin}>
                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="correo"
                      placeholder="correo@ejemplo.com"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      required
                    />
                    <label htmlFor="correo">Correo</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      className="form-control"
                      id="contrasena"
                      placeholder="Contraseña"
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      required
                    />
                    <label htmlFor="contrasena">Contraseña</label>
                  </div>

                  <div className="d-grid mb-3">
                    <button type="submit" className="btn btn-primary btn-lg">
                      Ingresar
                    </button>
                  </div>
                </form>
                <div className="text-end">
                  <a href="#" className="text-decoration-none text-muted">¿Olvidaste tu contraseña?</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
