import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FacturasEstadoPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  // si quieres partir en "Pendiente" cambia '' por 'Pendiente' (lo mapeamos a 'Vencida' para el back)
  const [filtro, setFiltro] = useState({ proveedor: '', estado_pago: '' });

  const API = import.meta.env.VITE_API_URL;

  // ===== Helpers de fecha/moneda (sin Date, solo strings día) =====
  const pad2 = (n) => String(n).padStart(2, '0');

  const todayISO = () => {
    const t = new Date();
    return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
  };

  const formatearFechaISO = (iso) => {
    if (!iso) return '-';
    const s = String(iso).slice(0, 10); // 'YYYY-MM-DD'
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return '-';
    const [, y, mm, d] = m;
    return `${d}-${mm}-${y}`;
  };

  const formatoCLP = (valor) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(Number(valor) || 0);

  // ===== Carga de datos =====
  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    cargarFacturas();
  }, [filtro]);

  const mapEstadoFiltro = (e) => {
    // el back usa 'Vencida' (no 'Pendiente'); también acepta 'Pagado', 'Vigente', 'Contado'
    if (e === 'Pendiente') return 'Vencida';
    return e || '';
  };

  const cargarFacturas = async () => {
    try {
      const res = await axios.get(`${API}api/facturas_estado`, {
        params: {
          proveedor: filtro.proveedor,
          estado_pago: mapEstadoFiltro(filtro.estado_pago),
        },
      });
      setFacturas(res.data || []);
      // DEBUG: mira campos devueltos por el back (vencimiento, dias_credito, estado_calculado, match_tipo)
      // console.table((res.data || []).map(x => ({
      //   id: x.id, prov: x.proveedor, fecha: x.fecha, dias: x.dias_credito,
      //   venc: x.vencimiento, est_calc: x.estado_calculado, match: x.match_tipo
      // })));
    } catch (err) {
      console.error('Error al cargar facturas/guías:', err);
      setFacturas([]);
    }
  };

  const cargarProveedores = async () => {
    try {
      const res = await axios.get(`${API}api/proveedores`);
      setProveedores(res.data || []);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setProveedores([]);
    }
  };

  // ===== Toggle de pago =====
  // Si está Pagado → lo volvemos a "no pagado" (estado_pago = null, fecha_pago = null) para que el back recalcule Vigente/Vencida.
  // Si NO está Pagado → lo marcamos Pagado con fecha de hoy.
  const handleTogglePago = async (f) => {
    try {
      if (f.estado_pago === 'Pagado') {
        await axios.put(`${API}api/facturas_guias/${f.id}`, {
          estado_pago: null,
          fecha_pago: null,
        });
      } else {
        await axios.put(`${API}api/facturas_guias/${f.id}`, {
          estado_pago: 'Pagado',
          fecha_pago: todayISO(),
        });
      }
      cargarFacturas();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  // ===== Observación interna =====
  const handleObservacionChange = async (id, texto) => {
    try {
      await axios.put(`${API}api/facturas_guias/${id}`, {
        observaciones_internas: texto,
      });
    } catch (err) {
      console.error('Error al actualizar observación interna:', err);
      alert('No se pudo actualizar la observación.');
    }
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
            <option value="Vigente">Vigente</option>
            <option value="Pendiente">Pendiente</option> {/* se mapea a 'Vencida' */}
            <option value="Contado">Contado</option>
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
            const dias = Number(f.dias_credito) || 0;
            const fechaISO = f.fecha || null;           // 'YYYY-MM-DD'
            const vencISO = f.vencimiento || null;      // 'YYYY-MM-DD' (calculado en el back)
            const hoyISO = todayISO();

            const vencido = f.estado_pago !== 'Pagado' && vencISO && vencISO < hoyISO;

            // Mostrar estado: si está pagado, mostramos Pagado; si no, usamos el calculado (Vigente/Vencida/Contado)
            const estadoMostrar =
              f.estado_pago === 'Pagado' ? 'Pagado' : (f.estado_calculado || 'Vigente');

            // color del botón según estadoMostrar
            const estadoBtn =
              estadoMostrar === 'Pagado'
                ? 'success'
                : estadoMostrar === 'Vigente'
                ? 'warning'
                : estadoMostrar === 'Vencida'
                ? 'danger'
                : 'secondary';

            const pagoISO = f.fecha_pago || null;
            const pagoIsHoy = pagoISO && pagoISO === hoyISO;
            const pagoEsViejo =
              pagoISO &&
              new Date(hoyISO) - new Date(pagoISO) > 7 * 24 * 60 * 60 * 1000;

            return (
              <tr key={i} className={vencido ? 'table-danger' : ''}>
                <td className="align-middle text-nowrap">
                  {fechaISO ? formatearFechaISO(fechaISO) : '-'}
                </td>
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
                  {vencISO ? formatearFechaISO(vencISO) : '-'}
                </td>
                <td>
                  <button
                    className={`btn btn-outline-${estadoBtn} btn-sm`}
                    onClick={() => handleTogglePago(f)}
                    title={`Estado actual: ${estadoMostrar}`}
                  >
                    {estadoMostrar === 'Pagado' && (
                      <span className="text-success fw-bold">🟢 Pagado</span>
                    )}
                    {estadoMostrar === 'Vigente' && (
                      <span className="text-warning fw-bold">🟡 Vigente</span>
                    )}
                    {estadoMostrar === 'Vencida' && (
                      <span className="text-danger fw-bold">🔴 Vencida</span>
                    )}
                    {estadoMostrar === 'Contado' && (
                      <span className="text-secondary fw-bold">⚪ Contado</span>
                    )}
                  </button>
                </td>
                <td
                  className={`align-middle text-nowrap ${
                    pagoISO
                      ? pagoIsHoy
                        ? 'table-success'
                        : pagoEsViejo
                        ? 'text-muted'
                        : ''
                      : 'text-secondary'
                  }`}
                >
                  {pagoISO ? formatearFechaISO(pagoISO) : '-'}
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
