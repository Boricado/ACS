import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FacturasEstadoPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [filtro, setFiltro] = useState({ proveedor: '', estado_pago: '' });

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarFacturas();
    cargarProveedores();
  }, [filtro]);

  const cargarFacturas = async () => {
    try {
      const res = await axios.get(`${API}api/facturas_guias`, { params: filtro });
      setFacturas(res.data);
    } catch (err) {
      console.error('Error al cargar facturas/guías:', err);
    }
  };

  const cargarProveedores = async () => {
    try {
      const res = await axios.get(`${API}api/proveedores`);
      setProveedores(res.data);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  };

  const handleTogglePago = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'Pagado' ? 'Pendiente' : 'Pagado';
    const fechaPago = nuevoEstado === 'Pagado' ? new Date().toISOString().split('T')[0] : null;

    try {
      await axios.put(`${API}api/facturas_guias/${id}`, {
        estado_pago: nuevoEstado,
        fecha_pago: fechaPago
      });
      cargarFacturas();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  const calcularVencimiento = (factura) => {
    const proveedor = proveedores.find(p => p.nombre === factura.proveedor);
    const dias = proveedor?.dias_credito || 0;
    const fecha = new Date(factura.fecha);
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split('T')[0];
  };

  const handleObservacionChange = async (id, texto) => {
    try {
      await axios.put(`${API}api/facturas_guias/${id}`, {
        observaciones_internas: texto
      });
    } catch (err) {
      console.error('Error al guardar observación interna:', err);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Control de Estado de Facturas / Guías</h2>

      <div className="row mb-3">
        <div className="col">
          <label>Proveedor</label>
          <select className="form-control" value={filtro.proveedor} onChange={e => setFiltro({ ...filtro, proveedor: e.target.value })}>
            <option value="">Todos</option>
            {proveedores.map((p, i) => (
              <option key={p.id} value={p.nombre}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col">
          <label>Estado de Pago</label>
          <select className="form-control" value={filtro.estado_pago} onChange={e => setFiltro({ ...filtro, estado_pago: e.target.value })}>
            <option value="">Todos</option>
            <option value="Pagado">Pagado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Vigente">Vigente</option>
          </select>
        </div>
      </div>

      <table className="table table-bordered table-hover table-sm text-center">
        <thead className="table-dark">
          <tr>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Guía</th>
            <th>Factura</th>
            <th>Monto Neto</th>
            <th>IVA</th>
            <th>Total</th>
            <th>Vencimiento</th>
            <th>Estado Pago</th>
            <th>Observaciones Internas</th>
          </tr>
        </thead>
        <tbody>
          {facturas.map((f, i) => {
            const vencimiento = calcularVencimiento(f);
            const hoy = new Date().toISOString().split('T')[0];
            const vencido = f.estado_pago !== 'Pagado' && vencimiento < hoy;

            return (
              <tr key={i} className={vencido ? 'table-danger' : ''}>
                <td>{f.fecha}</td>
                <td>{f.proveedor}</td>
                <td>{f.numero_guia}</td>
                <td>{f.numero_factura}</td>
                <td>${f.monto_neto?.toLocaleString()}</td>
                <td>${f.iva?.toLocaleString()}</td>
                <td>${f.monto_total?.toLocaleString()}</td>
                <td>{vencimiento}</td>
                <td>
                  <button className={`btn btn-sm ${f.estado_pago === 'Pagado' ? 'btn-success' : 'btn-warning'}`}
                    onClick={() => handleTogglePago(f.id, f.estado_pago)}>
                    {f.estado_pago}
                  </button>
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    defaultValue={f.observaciones_internas || ''}
                    onBlur={(e) => handleObservacionChange(f.id, e.target.value)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FacturasEstadoPage;
