import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProveedorPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    correo: '',
    telefono: '',
    direccion: ''
  });
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    obtenerProveedores();
  }, []);

  const obtenerProveedores = async () => {
    try {
      const res = await axios.get(`${API}api/proveedores`);
      setProveedores(res.data);
    } catch (err) {
      console.error('Error al obtener proveedores:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await axios.put(`${API}api/proveedores/${editandoId}`, form);
      } else {
        await axios.post(`${API}api/proveedores`, form);
      }
      setForm({
        nombre: '',
        rut: '',
        correo: '',
        telefono: '',
        direccion: ''
      });
      setEditandoId(null);
      obtenerProveedores();
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
    }
  };

  const editarProveedor = (proveedor) => {
    setForm(proveedor);
    setEditandoId(proveedor.id);
  };

  return (
    <div className="container mt-4">
      <h2>{editandoId ? 'Editar Proveedor' : 'Ingresar Proveedor'}</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="form-control"
              placeholder="Nombre"
              required
            />
          </div>
          <div className="col-md-4">
            <input
              type="text"
              name="rut"
              value={form.rut}
              onChange={handleChange}
              className="form-control"
              placeholder="RUT"
            />
          </div>
          <div className="col-md-4">
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              className="form-control"
              placeholder="Correo"
            />
          </div>
          <div className="col-md-4">
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="form-control"
              placeholder="Teléfono"
            />
          </div>
          <div className="col-md-8">
            <input
              type="text"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className="form-control"
              placeholder="Dirección"
            />
          </div>
        </div>
        <button type="submit" className="btn btn-success mt-3">
          {editandoId ? 'Guardar Cambios' : 'Agregar Proveedor'}
        </button>
      </form>

      <h4>Proveedores Registrados</h4>
      <table className="table table-bordered table-sm">
        <thead className="table-light">
          <tr>
            <th>Nombre</th>
            <th>RUT</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.rut}</td>
              <td>{p.correo}</td>
              <td>{p.telefono}</td>
              <td>{p.direccion}</td>
              <td>
                <button className="btn btn-primary btn-sm" onClick={() => editarProveedor(p)}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProveedorPage;
