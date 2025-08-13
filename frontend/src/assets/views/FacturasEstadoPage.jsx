import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FacturasEstadoPage = () => {
  // ================== ESTADO ==================
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [filtro, setFiltro] = useState({ proveedor: '', estado_pago: '' });

  const API = import.meta.env.VITE_API_URL;

  // ================== DEBUG / LOGS ==================
  const DEBUG_FACTURAS = true; // ← pon en false para apagar logs
  const dlog = (...a) => DEBUG_FACTURAS && console.log(...a);
  const dwarn = (...a) => DEBUG_FACTURAS && console.warn(...a);
  const dgroup = (label) => DEBUG_FACTURAS && console.groupCollapsed(label);
  const dgroupEnd = () => DEBUG_FACTURAS && console.groupEnd();

  // ================== HELPERS FECHA (diagnóstico) ==================
  const pad2 = (n) => String(n).padStart(2, '0');

  // Devuelve {y,m,d} o null; loguea qué detectó
  const parseToYMD = (value) => {
    if (!value) {
      dwarn('[parseToYMD] valor vacío');
      return null;
    }
    const s = String(value).slice(0, 10);

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      dlog('[parseToYMD] detectado YYYY-MM-DD:', s);
      return { y, m, d };
    }

    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
      const [d, m, y] = s.split('-').map(Number);
      dlog('[parseToYMD] detectado DD-MM-YYYY:', s, '→', `${y}-${pad2(m)}-${pad2(d)}`);
      return { y, m, d };
    }

    // Fallback: confiar en Date()
    const tmp = new Date(s);
    if (!isNaN(tmp)) {
      const y = tmp.getFullYear();
      const m = tmp.getMonth() + 1;
      const d = tmp.getDate();
      dlog('[parseToYMD] parse con Date():', s, '→', `${y}-${pad2(m)}-${pad2(d)}`);
      return { y, m, d };
    }

    dwarn('[parseToYMD] formato no reconocido/Invalid Date:', value);
    return null;
  };

  // Suma días en UTC y devuelve 'YYYY-MM-DD'
  const addDaysUTC_ISO = (isoY, isoM, isoD, days) => {
    const t = Date.UTC(isoY, isoM - 1, isoD) + (Number(days) || 0) * 86400000;
    const dt = new Date(t);
    return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
  };

  // ================== FORMATEOS ==================
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

  // ================== DATA ==================
  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    cargarFacturas();
  }, [filtro]);

  const cargarFacturas = async () => {
    try {
      const res = await axios.get(`${API}api/facturas_guias`, { params: filtro });
      const data = res.data || [];
      setFacturas(data);
      dlog('[FACTURAS] total:', data.length);
      dlog('[FACTURAS] muestra:', data.slice(0, 5).map((f) => ({
        id: f.id,
        proveedor: f.proveedor,
        fecha: f.fecha,
        estado: f.estado_pago,
        dias_credito: '(se calcula por match en proveedores)'
      })));
    } catch (err) {
      console.error('Error al cargar facturas/guías:', err);
      setFacturas([]);
    }
  };

  const cargarProveedores = async () => {
    try {
      const res = await axios.get(`${API}api/proveedores`);
      const data = res.data || [];
      setProveedores(data);
      dlog('[PROVEEDORES] total:', data.length);
      dlog('[PROVEEDORES] muestra:', data.slice(0, 5));
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setProveedores([]);
    }
  };

  const handleTogglePago = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'Pagado' ? 'Pendiente' : 'Pagado';
    const fechaPago = nuevoEstado === 'Pagado' ? new Date().toISOString().split('T')[0] : null;

    try {
      dlog('[TOGGLE] id=', id, 'estadoActual=', estadoActual, '→ nuevoEstado=', nuevoEstado, 'fechaPago=', fechaPago);
      await axios.put(`${API}api/facturas_guias/${id}`, {
        estado_pago: nuevoEstado,
        fecha_pago: fechaPago,
      });
      cargarFacturas();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  // ================== DIAS CREDITO (con logs) ==================
  const diasCreditoDe = (factura) => {
    const norm = (s) =>
      (s || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    const clave = norm(factura?.proveedor);
    dgroup(`diasCreditoDe → factura.proveedor="${factura?.proveedor}" (→ "${clave}")`);

    let provExact = proveedores.find((p) => norm(p.proveedor) === clave);
    dlog('matchExact?', !!provExact, provExact?.proveedor, 'dias_credito=', provExact?.dias_credito);

    let prov = provExact;
    if (!prov) {
      const provInc = proveedores.find((p) => {
        const np = norm(p.proveedor);
        return np.includes(clave) || clave.includes(np);
      });
      dlog('matchIncludes?', !!provInc, provInc?.proveedor, 'dias_credito=', provInc?.dias_credito);
      prov = provInc;
    }

    const diasRaw = prov?.dias_credito;
    const dias = Number(diasRaw);
    if (!prov) dwarn('⚠️ No se encontró proveedor coincidente.');
    if (!Number.isFinite(dias)) dwarn('⚠️ dias_credito no numérico:', diasRaw);

    dlog('⇒ dias_credito usado:', Number.isFinite(dias) ? dias : 0);
    dgroupEnd();
    return Number.isFinite(dias) ? dias : 0;
  };

  // ================== VENCIMIENTO (con logs) ==================
  const calcularVencimiento = (factura) => {
    const raw = factura?.fecha;
    dgroup(`calcularVencimiento → factura.id=${factura?.id} fecha_raw="${raw}"`);

    if (!raw) {
      dwarn('⚠️ factura sin fecha');
      dgroupEnd();
      return null;
    }

    // 1) Parse local (como venías haciendo)
    const dLocalBase = new Date(raw);
    dlog('parse local (new Date(raw)):', dLocalBase, 'isNaN?', isNaN(dLocalBase.getTime()));

    const dias = diasCreditoDe(factura);
    dlog('dias_credito=', dias);

    if (!isNaN(dLocalBase.getTime())) {
      const dLocal = new Date(dLocalBase);
      dLocal.setDate(dLocal.getDate() + dias); // suma local (puede drift)
      dlog('vencimiento local (setDate):', dLocal, 'ISO:', dLocal.toISOString());
    } else {
      dwarn('⚠️ fecha inválida (local):', raw);
    }

    // 2) Parse robusto → Y-M-D + suma UTC (sin drift)
    const ymd = parseToYMD(raw);
    if (ymd) {
      const isoUTC = addDaysUTC_ISO(ymd.y, ymd.m, ymd.d, dias);
      dlog('vencimiento UTC (robusto) →', isoUTC);
    } else {
      dwarn('⚠️ no se pudo parsear a Y-M-D:', raw);
    }

    // Mantener retorno original (Date local) para no romper UI actual
    if (!isNaN(dLocalBase.getTime())) {
      const out = new Date(dLocalBase);
      out.setDate(out.getDate() + dias);
      dgroupEnd();
      return out;
    }
    dgroupEnd();
    return null;
  };

  // ================== OBSERVACIÓN INTERNA ==================
  const handleObservacionChange = async (id, texto) => {
    try {
      dlog('[OBS] update id=', id, 'texto=', texto);
      await axios.put(`${API}api/facturas_guias/${id}`, {
        observaciones_internas: texto,
      });
    } catch (err) {
      console.error('Error al actualizar observación interna:', err);
      alert('No se pudo actualizar la observación.');
    }
  };

  // ================== RENDER ==================
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
            dgroup(`FILA #${i} | id=${f.id} | proveedor="${f.proveedor}" | fecha="${f.fecha}" | estado="${f.estado_pago}"`);

            const dias = diasCreditoDe(f);
            const venc = calcularVencimiento(f);
            const hoyISO = new Date().toISOString().split('T')[0];
            const vencISO = venc ? venc.toISOString().split('T')[0] : null;
            const vencido = f.estado_pago !== 'Pagado' && vencISO && vencISO < hoyISO;

            dlog('RESUMEN → dias_credito=', dias, '| vencISO(local)=', vencISO, '| hoyISO=', hoyISO, '| vencido?', vencido);
            dgroupEnd();

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
