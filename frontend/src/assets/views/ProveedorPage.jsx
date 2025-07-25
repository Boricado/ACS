import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProveedorPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({
    proveedor: '',
    rut: '',
    vendedor: '',
    contacto: '',
    banco: '',
    tipo_de_cuenta: '',
    numero_cuenta: '',
    dias_credito: ''
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
    if (!form.proveedor.trim()) {
      alert('El nombre del proveedor es obligatorio.');
      return;
    }

    try {
      if (editandoId) {
        await axios.put(`${API}api/proveedores/${editandoId}`, form);
      } else {
        await axios.post(`${API}api/proveedores`, form);
      }

      setForm({
        proveedor: '',
        rut: '',
        vendedor: '',
        contacto: '',
        banco: '',
        tipo_de_cuenta: '',
        numero_cuenta: '',
        dias_credito: ''
      });
      setEditandoId(null);
      obtenerProveedores();
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
    }
  };

  const editarProveedor = (p) => {
    setForm(p);
    setEditandoId(p.id);
  };

  return (
    <div className="container mt-4">
      <h2>{editandoId ? 'Editar Proveedor' : 'Ingresar Proveedor'}</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <input type="text" name="proveedor" value={form.proveedor} onChange={handleChange} className="form-control" placeholder="Nombre del proveedor" required />
          </div>
          <div className="col-md-4">
            <input type="text" name="rut" value={form.rut} onChange={handleChange} className="form-control" placeholder="RUT" />
          </div>
          <div className="col-md-4">
            <input type="text" name="vendedor" value={form.vendedor} onChange={handleChange} className="form-control" placeholder="Vendedor" />
          </div>
          <div className="col-md-4">
            <input type="text" name="contacto" value={form.contacto} onChange={handleChange} className="form-control" placeholder="Contacto" />
          </div>
          <div className="col-md-4">
            <input type="text" name="banco" value={form.banco} onChange={handleChange} className="form-control" placeholder="Banco" />
          </div>
          <div className="col-md-4">
            <input type="text" name="tipo_de_cuenta" value={form.tipo_de_cuenta} onChange={handleChange} className="form-control" placeholder="Tipo de cuenta" />
          </div>
          <div className="col-md-4">
            <input type="text" name="numero_cuenta" value={form.numero_cuenta} onChange={handleChange} className="form-control" placeholder="Número de cuenta" />
          </div>
          <div className="col-md-4">
            <input type="number" name="dias_credito" value={form.dias_credito} onChange={handleChange} className="form-control" placeholder="Días de crédito" />
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
            <th>Vendedor</th>
            <th>Contacto</th>
            <th>Banco</th>
            <th>Tipo cuenta</th>
            <th>N° Cuenta</th>
            <th>Días crédito</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map((p) => (
            <tr key={p.id}>
              <td>{p.proveedor || ''}</td>
              <td>{p.rut || ''}</td>
              <td>{p.vendedor || ''}</td>
              <td>{p.contacto || ''}</td>
              <td>{p.banco || ''}</td>
              <td>{p.tipo_de_cuenta || ''}</td>
              <td>{p.numero_cuenta || ''}</td>
              <td>{p.dias_credito || 0}</td>
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
