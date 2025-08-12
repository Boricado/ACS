import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FacturasEstadoPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [filtro, setFiltro] = useState({ proveedor: '', estado_pago: '' });

  const API = import.meta.env.VITE_API_URL;

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '-';
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}-${mes}-${anio}`;
  };

  const formatoCLP = (valor) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(Number(valor) || 0);

  // 🔧 Normaliza nombres para que macheen aunque cambie guiones/tildes/espacios
  const norm = (s) =>
    (s || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ''); // borra espacios, guiones, puntos, etc.

  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    cargarFacturas();
  }, [filtro]);

  const cargarFacturas = async () => {
    try {
      const res = await axios.get(`${API}api/facturas_guias`, { params: filtro });
      setFacturas(res.data || []);
    } catch (err) {
      console.error('Error al cargar facturas/guías:', err);
      setFacturas([]);
    }
  };

  const cargarProveedores = async () => {
    try {
      const res = await axios.get(`${API}api/proveedores`);
      // Esperamos campos: id, proveedor, dias_credito
      setProveedores(res.data || []);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setProveedores([]);
    }
  };

  const handleTogglePago = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'Pagado' ? 'Pendiente' : 'Pagado';
    const fechaPago = nuevoEstado === 'Pagado' ? new Date().toISOString().split('T')[0] : null;

    try {
      await axios.put(`${API}api/facturas_guias/${id}`, {
        estado_pago: nuevoEstado,
        fecha_pago: fechaPago,
      });
      cargarFacturas();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  // 👉 Devuelve días de crédito del proveedor de la factura, macheando por nombre normalizado
  const diasCreditoDe = (factura) => {
    const prov = proveedores.find(
      (p) => norm(p.proveedor) === norm(factura.proveedor)
    );
    return Number(prov?.dias_credito) || 0;
  };

  const calcularVencimiento = (factura) => {
    if (!factura?.fecha) return null;
    const d = new Date(factura.fecha);
    if (isNaN(d.getTime())) return null;
    const dias = diasCreditoDe(factura);
    // si es contado (0 días), el vencimiento = fecha misma (o podrías retornar null)
    d.setDate(d.getDate() + dias);
    return d;
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Control de Estado de Facturas / Guías</h2>

      <div className="row mb-3">
        <div className="col">
          <label>Proveedor</label>
          <select
            className="form-control"
            value={filtro.proveedor}
            onChange={(e) => setFiltro({ ...filtro, proveedor: e.target.value })}
          >
            <option value="">Todos</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.proveedor}>
                {p.proveedor}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <label>Estado de Pago</label>
          <select
            className="form-control"
            value={filtro.estado_pago}
            onChange={(e) => setFiltro({ ...filtro, estado_pago: e.target.value })}
          >
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
            <th>Fecha de Pago</th>
            <th>Observaciones Internas</th>
          </tr>
        </thead>
        <tbody>
          {facturas.map((f, i) => {
            const dias = diasCreditoDe(f); // 👈 ya detecta bien
            const venc = calcularVencimiento(f);
            const hoyISO = new Date().toISOString().split('T')[0];
            const vencISO = venc ? venc.toISOString().split('T')[0] : null;

            const vencido = f.estado_pago !== 'Pagado' && vencISO && vencISO < hoyISO;

            return (
              <tr key={i} className={vencido ? 'table-danger' : ''}>
                <td className="align-middle text-nowrap">{formatearFecha(f.fecha)}</td>
                <td className="align-middle">
                  {f.proveedor}
                  <div className="small text-muted">
                    {dias === 0 ? 'Contado' : `Crédito ${dias} días`}
                  </div>
                </td>
                <td className="align-middle">{f.numero_guia}</td>
                <td className="align-middle">{f.numero_factura}</td>
                <td className="align-middle">{formatoCLP(f.monto_neto)}</td>
                <td className="align-middle">{formatoCLP(f.iva)}</td>
                <td className="align-middle">{formatoCLP(f.monto_total)}</td>
                <td className="align-middle text-nowrap">
                  {venc ? formatearFecha(venc) : '-'}
                </td>
                <td>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => handleTogglePago(f.id, f.estado_pago)}
                    title={`Estado: ${f.estado_pago}`}
                  >
                    {f.estado_pago === 'Pagado' && (
                      <span className="text-success fw-bold">🟢 Pagado</span>
                    )}
                    {f.estado_pago === 'Vigente' && (
                      <span className="text-warning fw-bold">🟡 Vigente</span>
                    )}
                    {f.estado_pago === 'Pendiente' && (
                      <span className="text-danger fw-bold">🔴 Pendiente</span>
                    )}
                  </button>
                </td>

                <td
                  className={`align-middle text-nowrap ${
                    f.fecha_pago
                      ? new Date(f.fecha_pago).toISOString().split('T')[0] ===
                        new Date().toISOString().split('T')[0]
                        ? 'table-success'
                        : new Date(f.fecha_pago) <
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ? 'text-muted'
                        : ''
                      : 'text-secondary'
                  }`}
                >
                  {f.fecha_pago ? formatearFecha(f.fecha_pago) : '-'}
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
