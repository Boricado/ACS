import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FacturasGuiasPage = () => {
  const API = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    proveedor: '',
    numero_guia: '',
    numero_factura: '',
    fecha: '',
    monto_neto: '',
    iva: '',
    monto_total: '',
    observacion: ''
  });

  const [historial, setHistorial] = useState([]);
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [proveedores, setProveedores] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}api/facturas_guias`, form);
      alert('Factura/Guía registrada');
      setForm({
        proveedor: '',
        numero_guia: '',
        numero_factura: '',
        fecha: '',
        monto_neto: '',
        iva: '',
        monto_total: '',
        observacion: ''
      });
      fetchHistorial();
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Error al guardar');
    }
  };

  const fetchHistorial = async () => {
    try {
      const res = await axios.get(`${API}api/facturas_guias`, {
        params: { proveedor: filtroProveedor || undefined }
      });
      setHistorial(res.data);
    } catch (err) {
      console.error('Error al cargar historial:', err);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [filtroProveedor]);

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const res = await axios.get(`${API}api/proveedores`);
        setProveedores(res.data);
      } catch (err) {
        console.error('Error al cargar proveedores:', err);
      }
    };

    fetchProveedores();
  }, []);

  return (
    <div className="container py-4">
      <h3 className="mb-3">Ingreso de Factura o Guía</h3>
      <div className="row g-2 mb-3">
        {/* Proveedor con datalist */}
        <div className="col-md-3">
          <label>Proveedor</label>
          <input
            type="text"
            name="proveedor"
            list="lista-proveedores"
            className="form-control"
            value={form.proveedor}
            onChange={handleChange}
            placeholder="Selecciona proveedor"
          />
          <datalist id="lista-proveedores">
            {proveedores.map((p) => (
              <option key={p.id} value={p.nombre} />
            ))}
          </datalist>
        </div>

        {/* Resto de los campos */}
        {[
          { label: 'Guía', name: 'numero_guia' },
          { label: 'Factura', name: 'numero_factura' },
          { label: 'Fecha', name: 'fecha', type: 'date' },
          { label: 'Monto Neto', name: 'monto_neto' },
          { label: 'IVA', name: 'iva' },
          { label: 'Monto Total', name: 'monto_total' },
        ].map(({ label, name, type = 'text' }) => (
          <div className="col-md-3" key={name}>
            <label>{label}</label>
            <input
              type={type}
              name={name}
              className="form-control"
              value={form[name]}
              onChange={handleChange}
            />
          </div>
        ))}

        <div className="col-md-6">
          <label>Observación</label>
          <input
            type="text"
            name="observacion"
            className="form-control"
            value={form.observacion}
            onChange={handleChange}
          />
        </div>
      </div>

      <button className="btn btn-primary mb-4" onClick={handleSubmit}>
        Guardar
      </button>

      <h4>Historial</h4>
      <div className="mb-3">
        <input
          type="text"
          list="lista-proveedores"
          placeholder="Filtrar por proveedor"
          className="form-control"
          value={filtroProveedor}
          onChange={(e) => setFiltroProveedor(e.target.value)}
        />
      </div>

      <table className="table table-sm table-bordered text-center">
        <thead className="table-dark">
          <tr>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Guía</th>
            <th>Factura</th>
            <th>Monto Neto</th>
            <th>IVA</th>
            <th>Total</th>
            <th>Observación</th>
          </tr>
        </thead>
        <tbody>
          {historial.length === 0 ? (
            <tr><td colSpan="8">Sin registros</td></tr>
          ) : (
            historial.map((f, idx) => (
              <tr key={idx}>
                <td>{f.fecha}</td>
                <td>{f.proveedor}</td>
                <td>{f.numero_guia}</td>
                <td>{f.numero_factura}</td>
                <td>${Number(f.monto_neto).toLocaleString()}</td>
                <td>${Number(f.iva).toLocaleString()}</td>
                <td>${Number(f.monto_total).toLocaleString()}</td>
                <td>{f.observacion}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FacturasGuiasPage;
