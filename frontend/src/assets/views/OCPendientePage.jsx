// frontend/src/assets/views/OCPendientePage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const OCPendientePage = () => {
  const [ordenes, setOrdenes] = useState([]);
  const API = import.meta.env.VITE_API_URL;

  const [filtro, setFiltro] = useState({
    numero_oc: '',
    numero_presupuesto: '',
    proveedor: '',
    observacion: '',
    estado: 'Pendiente'
  });

  const [detallesVisibles, setDetallesVisibles] = useState({});

  // Mes para exportar (YYYY-MM)
  const [mesExcel, setMesExcel] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    cargarOrdenes();
  }, [filtro.estado]);

  const cargarOrdenes = async () => {
    try {
      let estadoParam = filtro.estado;
      if (estadoParam === 'Todas') {
        estadoParam = '';
      } else if (estadoParam === 'Pendiente') {
        estadoParam = 'PENDIENTE';
      }

      const res = await axios.get(`${API}api/ordenes_compra_estado`, {
        params: { estado: estadoParam }
      });
      setOrdenes(res.data);
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
    }
  };

  const handleFiltroChange = (e) => {
    setFiltro({ ...filtro, [e.target.name]: e.target.value });
  };

  const filtrarOrdenes = ordenes.filter((o) =>
    o.numero_oc.toLowerCase().includes(filtro.numero_oc.toLowerCase()) &&
    o.numero_presupuesto?.toString().includes(filtro.numero_presupuesto) &&
    o.proveedor.toLowerCase().includes(filtro.proveedor.toLowerCase()) &&
    o.observacion?.toLowerCase().includes(filtro.observacion.toLowerCase())
  );

  const toggleDetalle = (numero_oc) => {
    setDetallesVisibles((prev) => ({
      ...prev,
      [numero_oc]: !prev[numero_oc]
    }));
  };

  // ---------- Helpers para fechas y Excel ----------
  const parseFechaToDate = (val) => {
    // Acepta "YYYY-MM-DD", ISO, o "DD-MM-YYYY"
    if (!val) return null;
    if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
      const [dd, mm, yyyy] = val.split('-').map((x) => parseInt(x, 10));
      return new Date(yyyy, mm - 1, dd);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const coincideMes = (val, yyyymm) => {
    const d = parseFechaToDate(val);
    if (!d || !yyyymm) return false;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return ym === yyyymm;
  };

  const fmtFecha = (val) => {
    const d = parseFechaToDate(val);
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const autoCols = (rows) => {
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    const widths = keys.map((k) =>
      Math.max(k.length, ...rows.map((r) => String(r[k] ?? '').length))
    );
    return widths.map((w) => ({ wch: Math.min(Math.max(w + 2, 10), 60) }));
  };

// Pon esto dentro de tu componente, reemplazando exportarExcel:

const exportarExcel = async () => {
  try {
    // Carga dinámica: evita problemas de bundling/SSR
    const mod = await import('xlsx');
    const XLSX = mod.default || mod;

    // Mapea el estado del filtro UI a lo que llega desde el backend
    const estadoFiltroToDB = (val) => {
      if (val === 'Pendiente') return 'PENDIENTE';
      if (val === 'Completa') return 'COMPLETA';
      return ''; // Todas
    };
    const estadoDB = estadoFiltroToDB(filtro.estado);

    // 1) Filtra órdenes por el mes elegido y por el estado del filtro
    const ocMes = ordenes.filter((o) => {
      const okMes = coincideMes(o.fecha, mesExcel);
      const okEstado = estadoDB ? String(o.estado || '').toUpperCase() === estadoDB : true;
      return okMes && okEstado;
    });

    if (ocMes.length === 0) {
      alert('No hay órdenes en el mes/estado seleccionados.');
      return;
    }

    // 2) Hoja principal: resumen de OC con totales e indicador de estado
    const rowsOC = ocMes.map((o) => {
      const totalNeto = Number(o.total_neto ?? 0);
      const iva = Math.round(totalNeto * 0.19);
      const total = Math.round(totalNeto + iva);
      const estadoUI = (String(o.estado || '').toUpperCase() === 'PENDIENTE')
        ? 'Pendiente'
        : (String(o.estado || '').toUpperCase() === 'COMPLETA')
          ? 'Completa'
          : String(o.estado || '');

      return {
        'N° OC': o.numero_oc,
        'Proveedor': o.proveedor,
        'Fecha': fmtFecha(o.fecha),
        'N° Presupuesto': o.numero_presupuesto ?? '',
        'Observación': o.observacion ?? '',
        'Total Neto': totalNeto,
        'IVA 19%': iva,
        'Total': total,
        'Estado': estadoUI
      };
    });
    const wsOC = XLSX.utils.json_to_sheet(rowsOC);
    wsOC['!cols'] = autoCols(rowsOC);

    // 3) Hoja de detalles (una fila por ítem) + Estado OC
    const rowsDet = [];
    ocMes.forEach((o) => {
      const estadoUI = (String(o.estado || '').toUpperCase() === 'PENDIENTE')
        ? 'Pendiente'
        : (String(o.estado || '').toUpperCase() === 'COMPLETA')
          ? 'Completa'
          : String(o.estado || '');
      (o.detalles ?? []).forEach((d) => {
        const pendientes = (d.cantidad || 0) - (d.cantidad_llegada || 0);
        rowsDet.push({
          'N° OC': o.numero_oc,
          'Proveedor': o.proveedor,
          'Fecha OC': fmtFecha(o.fecha),
          'Código': d.codigo ?? '',
          'Producto': d.producto ?? '',
          'Cant. Total': d.cantidad ?? 0,
          'Precio Unit.': d.precio_unitario ?? 0,
          'Cant. Llegada': d.cantidad_llegada ?? 0,
          'Cant. Pendiente': pendientes,
          'Comentario Ítem': d.observacion_ingreso ?? '',
          'Estado OC': estadoUI
        });
      });
    });
    const wsDet = XLSX.utils.json_to_sheet(rowsDet);
    wsDet['!cols'] = autoCols(rowsDet);

    // 4) Libro y descarga
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsOC, 'OC');
    XLSX.utils.book_append_sheet(wb, wsDet, 'Detalles');
    const nombre = `OC_${mesExcel}_${filtro.estado}.xlsx`;
    XLSX.writeFile(wb, nombre);
  } catch (e) {
    console.error(e);
    alert('No se pudo generar el Excel.');
  }
};

  // ------------------------------------------------

  return (
    <div className="container mt-4">
      <h4>Órdenes de Compra</h4>

      <div className="d-flex mb-3 gap-2 flex-wrap align-items-center">
        <input
          name="numero_oc"
          className="form-control"
          placeholder="N° OC"
          value={filtro.numero_oc}
          onChange={handleFiltroChange}
          style={{ maxWidth: 140 }}
        />
        <input
          name="numero_presupuesto"
          className="form-control"
          placeholder="N° Presupuesto"
          value={filtro.numero_presupuesto}
          onChange={handleFiltroChange}
          style={{ maxWidth: 180 }}
        />
        <input
          name="proveedor"
          className="form-control"
          placeholder="Proveedor"
          value={filtro.proveedor}
          onChange={handleFiltroChange}
          style={{ minWidth: 220 }}
        />
        <input
          name="observacion"
          className="form-control"
          placeholder="Observación"
          value={filtro.observacion}
          onChange={handleFiltroChange}
          style={{ minWidth: 260 }}
        />
        <select
          name="estado"
          className="form-select"
          value={filtro.estado}
          onChange={handleFiltroChange}
          style={{ maxWidth: 160 }}
        >
          <option>Pendiente</option>
          <option>Completa</option>
          <option>Todas</option>
        </select>

        {/* --- Exportación por mes --- */}
        <input
          type="month"
          className="form-control"
          value={mesExcel}
          onChange={(e) => setMesExcel(e.target.value)}
          style={{ maxWidth: 160 }}
          title="Mes a exportar"
        />
        <button className="btn btn-success" onClick={exportarExcel}>
          Exportar Excel
        </button>
      </div>

      <table className="table table-hover">
        <thead>
          <tr>
            <th>N° OC</th>
            <th>Proveedor</th>
            <th>Fecha</th>
            <th>Observación</th>
          </tr>
        </thead>
        <tbody>
          {filtrarOrdenes.map((o, i) => (
            <React.Fragment key={i}>
              <tr onClick={() => toggleDetalle(o.numero_oc)} style={{ cursor: 'pointer' }}>
                <td>{o.numero_oc}</td>
                <td>{o.proveedor}</td>
                <td>{fmtFecha(o.fecha)}</td>
                <td>{o.observacion}</td>
              </tr>
              {detallesVisibles[o.numero_oc] && o.detalles && (
                <tr>
                  <td colSpan="4">
                    <table className="table table-sm table-bordered mb-0">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Producto</th>
                          <th>Cantidad Total</th>
                          <th>Precio Unitario</th>
                          <th>Cant. Llegadas</th>
                          <th>Cant. Pendientes</th>
                          <th>Comentario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.detalles.map((d, idx) => {
                          const pendientes = (d.cantidad || 0) - (d.cantidad_llegada || 0);
                          const llegadaOK = pendientes === 0;
                          return (
                            <tr key={idx}>
                              <td>{d.codigo}</td>
                              <td>{d.producto}</td>
                              <td>{d.cantidad}</td>
                              <td>${(d.precio_unitario ?? 0).toLocaleString()}</td>
                              <td>
                                <span className={`badge ${llegadaOK ? 'bg-success' : 'bg-secondary'}`}>
                                  {d.cantidad_llegada || 0} {llegadaOK ? '✔️' : '↺'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${pendientes > 0 ? 'bg-danger' : 'bg-success'}`}>
                                  {pendientes} {pendientes > 0 ? '⚠️' : '✔️'}
                                </span>
                              </td>
                              <td>{d.observacion_ingreso || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="text-end mt-2">
                      <p><strong>Total Neto:</strong> ${(o.total_neto ?? 0).toLocaleString()}</p>
                      <p><strong>IVA 19%:</strong> ${Math.round((o.total_neto ?? 0) * 0.19).toLocaleString()}</p>
                      <p><strong>Total:</strong> {Math.round((o.total_neto ?? 0) * 1.19).toLocaleString()}</p>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OCPendientePage;
