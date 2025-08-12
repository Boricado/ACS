import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FacturasEstadoPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [filtro, setFiltro] = useState({ proveedor: '', estado_pago: '' });

  const API = import.meta.env.VITE_API_URL;

  // ========= Helpers =========
  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}-${mes}-${anio}`;
  };

  const formatoCLP = (valor) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(valor || 0);

  const isoDate = (d) => (new Date(d)).toISOString().split('T')[0];

  const addDaysISO = (fechaISO, dias) => {
    const d = new Date(fechaISO);
    d.setDate(d.getDate() + (Number(dias) || 0));
    return isoDate(d);
  };

  // normaliza strings (quita tildes, espacios, signos, etc.)
  const norm = (s) =>
    (s ?? '')
      .toString()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[\s.\-_/,&]+/g, '')
      .toLowerCase()
      .trim();

  const getNombreProveedor = (p) => (p?.nombre ?? p?.proveedor ?? '').toString();

  // Obtiene días de crédito del proveedor de una factura:
  // 1) si viene proveedor_id, mach por id
  // 2) si no, intenta por nombre robusto
  const getDiasCredito = (factura) => {
    // por ID si viene
    if (factura?.proveedor_id != null) {
      const pById = proveedores.find(
        (x) => String(x.id) === String(factura.proveedor_id)
      );
      if (pById) return Number(pById.dias_credito) || 0;
    }
    // por nombre
    const fNorm = norm(factura?.proveedor);
    if (!fNorm) return 0;

    const provs = proveedores.map((p) => {
      const nombre = getNombreProveedor(p);
      return { ...p, _nombre: nombre, _norm: norm(nombre) };
    });

    // match exacto
    let p = provs.find((x) => x._norm === fNorm);
    if (p) return Number(p.dias_credito) || 0;

    // contiene / incluido (por si hay variantes)
    p = provs.find((x) => x._norm.includes(fNorm) || fNorm.includes(x._norm));
    return p ? (Number(p.dias_credito) || 0) : 0;
  };

  const calcularVencimiento = (factura) => {
    const dias = getDiasCredito(factura);
    return addDaysISO(factura.fecha, dias);
  };

  // ========= Data =========
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
    const fechaPago = nuevoEstado === 'Pagado' ? isoDate(new Date()) : null;

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

  const handleObservacionChange = async (id, texto) => {
    try {
      await axios.put(`${API}api/facturas_guias/${id}`, {
        observaciones_internas: texto,
      });
    } catch (err) {
      console.error('Error al guardar observación interna:', err);
    }
  };

  // ========= Render =========
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
            {proveedores.map((p) => {
              const nombre = getNombreProveedor(p);
              return (
                <option key={p.id} value={nombre}>
                  {nombre}
                </option>
              );
            })}
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
            const diasCredito = getDiasCredito(f);
            const vencimiento = calcularVencimiento(f);
            const hoy = isoDate(new Date());
            const esContado = diasCredito === 0;
            const vencida = !esContado && f.estado_pago !== 'Pagado' && vencimiento < hoy;

            return (
              <tr key={i} className={vencida ? 'table-danger' : ''}>
                <td className="align-middle text-nowrap">{formatearFecha(f.fecha)}</td>
                <td className="align-middle">{f.proveedor}</td>
                <td className="align-middle">{f.numero_guia}</td>
                <td className="align-middle">{f.numero_factura}</td>
                <td className="align-middle">{formatoCLP(f.monto_neto)}</td>
                <td className="align-middle">{formatoCLP(f.iva)}</td>
                <td className="align-middle">{formatoCLP(f.monto_total)}</td>
                <td className="align-middle text-nowrap">
                  {esContado ? '—' : formatearFecha(vencimiento)}
                </td>

                <td className="align-middle">
                  {esContado ? (
                    <span className="badge text-bg-success">Contado (pagada)</span>
                  ) : (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handleTogglePago(f.id, f.estado_pago)}
                      title={`Estado actual: ${f.estado_pago}`}
                    >
                      {f.estado_pago === 'Pagado' && (
                        <span className="text-success fw-bold">🟢 Pagada</span>
                      )}
                      {f.estado_pago !== 'Pagado' && vencida && (
                        <span className="text-danger fw-bold">🔴 Vencida</span>
                      )}
                      {f.estado_pago !== 'Pagado' && !vencida && (
                        <span className="text-warning fw-bold">🟡 Vigente</span>
                      )}
                    </button>
                  )}
                </td>

                <td
                  className={`align-middle text-nowrap ${
                    f.fecha_pago
                      ? isoDate(f.fecha_pago) === hoy
                        ? 'table-success'
                        : new Date(f.fecha_pago) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ? 'text-muted'
                        : ''
                      : 'text-secondary'
                  }`}
                >
                  {f.fecha_pago ? formatearFecha(f.fecha_pago) : esContado ? '—' : '-'}
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
