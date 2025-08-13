import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FacturasEstadoPage = () => {
  // Estado
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  // Si quieres partir mostrando pendientes, cambia '' por 'Pendiente'
  const [filtro, setFiltro] = useState({ proveedor: '', estado_pago: '' });

  const API = import.meta.env.VITE_API_URL;

  // ===== Helpers de fecha y formato (blindados UTC) =====
  const pad2 = (n) => String(n).padStart(2, '0');

  // Devuelve 'YYYY-MM-DD' desde Date | 'YYYY-MM-DD' | 'DD-MM-YYYY' | ISO con hora
  const asISODate = (value) => {
    if (!value) return null;
    const s = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;        // YYYY-MM-DD
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {                // DD-MM-YYYY
      const [d, m, y] = s.split('-');
      return `${y}-${m}-${d}`;
    }
    const d = new Date(s);
    if (isNaN(d)) return null;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };

  // Suma días en UTC y devuelve 'YYYY-MM-DD'
  const addDaysUTC_ISO = (y, m, d, days) => {
    const t = Date.UTC(Number(y), Number(m) - 1, Number(d)) + (Number(days) || 0) * 86400000;
    const dt = new Date(t);
    return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
  };

  const isoToUTCDate = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };

  const todayISO = () => {
    const t = new Date();
    return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
  };

  const formatearFechaISO = (iso) => {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return `${d}-${m}-${y}`;
  };

  const formatoCLP = (valor) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(Number(valor) || 0);

  // ===== Normalización de proveedor =====
  const norm = (s) =>
    (s || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  // ===== Data =====
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
      setProveedores(res.data || []);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setProveedores([]);
    }
  };

  // ===== Días de crédito por proveedor (con fallback por "includes") =====
  const diasCreditoDe = (factura) => {
    const clave = norm(factura?.proveedor);
    let prov = proveedores.find((p) => norm(p.proveedor) === clave);
    if (!prov) {
      prov = proveedores.find((p) => {
        const np = norm(p.proveedor);
        return np.includes(clave) || clave.includes(np);
      });
    }
    const dias = Number(prov?.dias_credito);
    return Number.isFinite(dias) ? dias : 0;
  };

  // ===== Vencimiento blindado (ISO string) =====
  const calcularVencimientoISO = (factura) => {
    const base = asISODate(factura?.fecha);  // ej: '2025-07-29'
    if (!base) return null;
    const dias = diasCreditoDe(factura);     // ej: 30
    const [y, m, d] = base.split('-').map(Number);
    const iso = addDaysUTC_ISO(y, m, d, dias); // ej: '2025-08-28'
    // console.log('[VENCIMIENTO-FINAL]', { base, dias, iso });
    return iso;
  };

  // Determina estado no pagado según fechas (Vigente/Pendiente)
  const estadoNoPagadoSegunFechas = (factura) => {
    const hoy = todayISO();
    const venc = calcularVencimientoISO(factura);
    if (!venc) return 'Pendiente';
    return hoy <= venc ? 'Vigente' : 'Pendiente';
  };

  // Toggle: si no está pagado → Pagado (fecha_pago = hoy).
  // Si está pagado → vuelve a Vigente/Pendiente según vencimiento.
  const handleTogglePago = async (factura) => {
    const hoy = todayISO();
    const pagado = factura.estado_pago === 'Pagado';
    const nuevoEstado = pagado ? estadoNoPagadoSegunFechas(factura) : 'Pagado';
    const fechaPago = nuevoEstado === 'Pagado' ? hoy : null;

    try {
      await axios.put(`${API}api/facturas_guias/${factura.id}`, {
        estado_pago: nuevoEstado,
        fecha_pago: fechaPago,
      });
      cargarFacturas();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  // Observación interna
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

  // ===== Render =====
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
            const dias = diasCreditoDe(f);
            const fechaISO = asISODate(f.fecha);            // 'YYYY-MM-DD'
            const vencISO = calcularVencimientoISO(f);      // 'YYYY-MM-DD'
            const hoyISO = todayISO();

            const vencido = f.estado_pago !== 'Pagado' && vencISO && vencISO < hoyISO;

            const pagoISO = asISODate(f.fecha_pago);
            const pagoIsHoy = pagoISO === hoyISO;
            const pagoEsViejo =
              pagoISO &&
              isoToUTCDate(hoyISO) - isoToUTCDate(pagoISO) > 7 * 24 * 60 * 60 * 1000;

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
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => handleTogglePago(f)}
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
