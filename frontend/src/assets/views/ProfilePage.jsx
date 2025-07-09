import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import profilePics from '../img/Profile.jpg';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ProfilePage = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const API = import.meta.env.VITE_API_URL;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCambioContrasena = async () => {
    setMensaje('');
    setError('');
    if (nuevaContrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await axios.put(`${API}api/usuarios/${usuario.id}/cambiar-contrasena`, {
        nuevaContrasena
      });
      setMensaje('Contraseña actualizada con éxito');
      setNuevaContrasena('');
    } catch (err) {
      console.error(err);
      setError('Hubo un error al cambiar la contraseña');
    }
  };

  if (!usuario) return null;

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="card p-4" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="d-flex align-items-center">
          <img src={profilePics} className="rounded" width="140" alt="Profile" />
          <div className="ms-3">
            <h4 className="mb-1">{usuario.nombre}</h4>
            <p className="text-muted mb-0">Rol: {usuario.rol}</p>
            <small>{usuario.correo}</small>
          </div>
        </div>

        <hr />

        <h5 className="mt-3">Cambiar contraseña</h5>
        <div className="input-group mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Nueva contraseña"
            value={nuevaContrasena}
            onChange={(e) => setNuevaContrasena(e.target.value)}
          />
          <button className="btn btn-dark" onClick={handleCambioContrasena}>
            Actualizar
          </button>
        </div>
        {mensaje && <div className="alert alert-success">{mensaje}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-flex justify-content-between mt-4">
          <button className="btn btn-danger" onClick={handleLogout}>
            Cerrar sesión <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
