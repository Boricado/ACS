// src/views/ClientePage.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ClientePage = () => {
  const [cliente, setCliente] = useState({
    nombre: '',
    rut: '',
    correo: '',
    telefono: '',
    direccion: ''
  });

  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
  };

  const guardarCliente = async () => {
  if (!cliente.nombre || !cliente.rut) {
    setMensaje({ tipo: 'error', texto: 'Nombre y RUT son obligatorios' });
    return;
  }

  try {
    setLoading(true);
    const res = await axios.post(`${import.meta.env.VITE_API_URL}api/clientes`, cliente);
    setMensaje({ tipo: 'success', texto: 'Cliente guardado correctamente' });
    setCliente({ nombre: '', rut: '', correo: '', telefono: '', direccion: '' });
  } catch (error) {
    setMensaje({ tipo: 'error', texto: 'Error al guardar el cliente' });
  } finally {
    setLoading(false);
  }
};

return (
  <div className="p-4 max-w-4xl mx-auto bg-white shadow rounded mt-5">
    <h2 className="text-xl font-bold mb-4 text-center">Ingreso de Cliente</h2>

    <form className="container">
      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={cliente.nombre}
            onChange={handleChange}
            className="form-control rounded"
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">RUT</label>
          <input
            type="text"
            name="rut"
            value={cliente.rut}
            onChange={handleChange}
            className="form-control rounded"
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Correo</label>
          <input
            type="email"
            name="correo"
            value={cliente.correo}
            onChange={handleChange}
            className="form-control rounded"
          />
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label">Teléfono</label>
          <input
            type="text"
            name="telefono"
            value={cliente.telefono}
            onChange={handleChange}
            className="form-control rounded"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Dirección</label>
          <input
            type="text"
            name="direccion"
            value={cliente.direccion}
            onChange={handleChange}
            className="form-control rounded"
          />
        </div>
      </div>
    </form>

    <div className="text-center">
      <button
        onClick={guardarCliente}
        disabled={loading}
        className="btn btn-outline-primary px-4"
      >
        {loading ? 'Guardando...' : 'Guardar Cliente'}
      </button>
    </div>

    {mensaje && (
      <p
        className={`mt-4 p-2 text-center rounded ${
          mensaje.tipo === 'error'
            ? 'bg-danger text-white'
            : 'bg-success text-white'
        }`}
      >
        {mensaje.texto}
      </p>
    )}
  </div>
);
};

export default ClientePage;
