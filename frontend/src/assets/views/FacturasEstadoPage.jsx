import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FacturasEstadoPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  // Si quieres partir mostrando pendientes, deja "Pendiente" aquí:
  const [filtro, setFiltro] = useState({ proveedor: '', estado_pago: '' });

  const API = import.meta.env.VITE_API_URL;

  // ------------------ HELPERS DE FECHA (sin sorpresas de timezone) ------------------

  const pad2 = (n) => String(n).padStart(2, '0');

  // Asegura devolver 'YYYY-MM-DD' o null, acepte Date, 'YYYY-MM-DD', 'DD-MM-YYYY' y otras cadenas ISO.
  const asISODate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value)) {
      return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
    }
    const s = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // YYYY-MM-DD
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {         // DD-MM-YYYY
      const [d, m, y] = s.split('-').map((x) => x.trim());
      return `${y}-${m}-${d}`;
    }
    const d = new Date(value);
    if (isNaN(d)) return null;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };

  // Suma días usando UTC (evita drift local)
  const addDaysISO = (iso, days) => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + (Number(days) || 0)));
    return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
  };

  // Hoy en local como YYYY-MM-DD (day-only)
  const todayISO = () => {
    const t = new Date();
    return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
  };

  // Formatea YYYY-MM-DD → DD-MM-YYYY
  const formatearFechaISO = (iso) => {
    if (!iso) return '-';
    const s = asISODate(iso);
    if (!s) return '-';
    const [y, m, d] = s.split('-');
    return `${d}-${m}-${y}`;
  };

  // ------------------ MONEDA ------------------
  const formatoCLP = (valor) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(Number(valor) || 0);

  // ------------------ NORMALIZACIÓN PROVEEDOR ------------------
  const norm = (s) =>
    (s || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  // ------------------ DATA ------------------
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

  // Días de crédito del proveedor de la factura (match exacto + fallback "incluye")
  const diasCreditoDe = (factura) => {
    const nfac = norm(factura?.proveedor);
    let prov = proveedores.find((p) => norm(p.proveedor) === nfac);
    if (!prov) {
      prov = proveedores.find((p) => nfac && norm(p.proveedor).includes(nfac));
    }
    return Number(prov?.dias_credito) || 0;
  };

  // Vencimiento como YYYY-MM-DD plano
  const calcularVencimientoISO = (factura) => {
    const base = asISODate(factura?.fecha);
    if (!base) return null;
    const dias = diasCreditoDe(factura);
    return addDaysISO(base, dias);
  };

  // Estado “no pagado” según hoy y vencimiento
  const estadoNoPagadoSegunFechas = (factura) => {
    const hoy = todayISO();
    const venc = calcularVencimientoISO(factura);
    if (!venc) return 'Pendiente'; // sin fecha → trátalo como pendiente
    return hoy <= venc ? 'Vigente' : 'Pendiente';
  };

  // Guarda/actualiza observación interna
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

  // Toggle: si no está pagado → Pagado (fecha_pago = hoy).
  // Si está pagado → vuelve al no-pagado correcto (Vigente o Pendiente) según fechas.
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
            const hoyISO = todayISO();
            const vencISO = calcularVencimientoISO(f);
            const vencido = f.estado_pago !== 'Pagado' && vencISO && vencISO < hoyISO;

            return (
              <tr key={i} className={vencido ? 'table-danger' : ''}>
                <td className="align-middle text-nowrap">{formatearFechaISO(asISODate(f.fecha))}</td>
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
                    f.fecha_pago
                      ? asISODate(f.fecha_pago) === hoyISO
                        ? 'table-success'
                        : new Date(asISODate(f.fecha_pago)) <
                          new Date(todayISO().replace(/-/g, '/')) - 7 * 24 * 60 * 60 * 1000
                        ? 'text-muted'
                        : ''
                      : 'text-secondary'
                  }`}
                >
                  {f.fecha_pago ? formatearFechaISO(asISODate(f.fecha_pago)) : '-'}
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
