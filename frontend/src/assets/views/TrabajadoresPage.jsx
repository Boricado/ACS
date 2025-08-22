import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const JORNADA_DIARIA = 9; // horas/día

const inputStyle = {
  minWidth: 110,
  minHeight: 38,
  fontSize: '0.95rem',
  backgroundColor: '#fff'
};
const inputWide = { ...inputStyle, minWidth: 220 };

const fixNum = (v) => {
  const n = Number(String(v ?? '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : 0;
};
const toNum = (x) => {
  const n = Number(String(x ?? '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : 0;
};

const TrabajadoresPage = () => {
  const API = import.meta.env.VITE_API_URL;

  const periodoActual = new Date().toISOString().slice(0, 7);
  const [periodo, setPeriodo] = useState(periodoActual);

  const [trabajadores, setTrabajadores] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [copiando, setCopiando] = useState(false);

  const prevMonth = (ym) => {
    const [y, m] = (ym || '').split('-').map(Number);
    if (!y || !m) return '';
    const nm = m === 1 ? 12 : m - 1;
    const ny = m === 1 ? y - 1 : y;
    return `${ny}-${String(nm).padStart(2, '0')}`;
  };

  const recalcDerivados = (t) => {
    const dias = fixNum(t.dias_trab);
    const extras = fixNum(t.horas_extras);
    const retraso = fixNum(t.horas_retraso);
    const horas_trab = Math.max(0, dias * JORNADA_DIARIA);
    const horas_acum_trab = Math.max(0, horas_trab + extras - retraso);
    return { ...t, dias_trab: dias, horas_extras: extras, horas_retraso: retraso, horas_trab, horas_acum_trab };
  };

  const cargarTrabajadores = async () => {
    try {
      const res = await axios.get(`${API}api/trabajadores`, { params: { periodo } });
      const normalizados = (res.data || []).map(r => ({
        ...r,
        dias_trab: fixNum(r.dias_trab),
        horas_extras: fixNum(r.horas_extras),
        horas_retraso: fixNum(r.horas_retraso),
      }));
      const recalculados = normalizados.map(recalcDerivados);
      setTrabajadores(recalculados);
    } catch (e) {
      console.error(e);
      setTrabajadores([]);
    }
  };

  useEffect(() => {
    cargarTrabajadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  const handleChange = (idx, field, value) => {
    const next = [...trabajadores];
    const numericFields = ['dias_trab', 'horas_extras', 'horas_retraso'];

    if (numericFields.includes(field)) {
      const norm = value === '' ? '' : String(value).replace(',', '.');
      const v = norm === '' ? '' : Number(norm);
      next[idx][field] = Number.isFinite(v) ? v : 0;
    } else {
      next[idx][field] = value;
    }

    next[idx] = recalcDerivados(next[idx]);
    setTrabajadores(next);
  };

  const agregarFila = () => {
    const base = recalcDerivados({
      id: null,
      periodo,
      nombre: '',
      dias_trab: 0,
      horas_extras: 0,
      horas_retraso: 0,
      observacion: ''
    });
    setTrabajadores(prev => [...prev, base]);
  };

  const guardarFila = async (idx) => {
    const t = recalcDerivados(trabajadores[idx]);

    if (!t.nombre?.trim()) {
      setMensaje({ tipo: 'danger', texto: 'El nombre es obligatorio.' });
      return;
    }

    const payload = {
      periodo: t.periodo || periodo,
      nombre: t.nombre?.trim(),
      dias_trab: parseInt(fixNum(t.dias_trab) || 0, 10),
      horas_trab: toNum(t.horas_trab || 0),
      horas_extras: toNum(t.horas_extras || 0),
      horas_retraso: toNum(t.horas_retraso || 0),
      observacion: t.observacion || '',
      horas_acum_trab: toNum(t.horas_acum_trab || 0)
    };

    try {
      if (t.id) {
        const res = await axios.put(`${API}api/trabajadores/${t.id}`, payload);
        const next = [...trabajadores];
        next[idx] = recalcDerivados(res.data);
        setTrabajadores(next);
        setMensaje({ tipo: 'success', texto: 'Trabajador actualizado.' });
      } else {
        const res = await axios.post(`${API}api/trabajadores`, payload);
        const next = [...trabajadores];
        next[idx] = recalcDerivados(res.data);
        setTrabajadores(next);
        setMensaje({ tipo: 'success', texto: 'Trabajador creado.' });
      }
    } catch (e) {
      console.error(e);
      setMensaje({ tipo: 'danger', texto: 'Error al guardar.' });
    }
  };

  const eliminarFila = async (idx) => {
    const t = trabajadores[idx];
    if (t.id) {
      const ok = confirm(`¿Eliminar trabajador #${t.id} - ${t.nombre}?`);
      if (!ok) return;
      try {
        await axios.delete(`${API}api/trabajadores/${t.id}`);
      } catch (e) {
        console.error(e);
        setMensaje({ tipo: 'danger', texto: 'Error al eliminar.' });
        return;
      }
    }
    const next = [...trabajadores];
    next.splice(idx, 1);
    setTrabajadores(next);
    setMensaje({ tipo: 'success', texto: 'Eliminado.' });
  };

  // === NUEVO: diasPlan = máximo dias_trab del mes, recalculado siempre ===
  const diasPlan = useMemo(
    () => trabajadores.reduce((max, t) => {
      const d = toNum(t.dias_trab);
      return d > max ? d : max;
    }, 0),
    [trabajadores]
  );

  // % HORA ASIST = (DIAS_TRAB × 9 − HORAS_RETRASO) / (DIAS_PLAN × 9) * 100
  // Ignoramos extras; capado 0–100.
  const pctAsistencia = (t) => {
    const base = toNum(diasPlan) * JORNADA_DIARIA;
    if (base <= 0) return 0;

    const horasEfectivas = Math.max(
      0,
      toNum(t.dias_trab) * JORNADA_DIARIA - toNum(t.horas_retraso)
    );

    const pct = (horasEfectivas / base) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  const copiarMesAnterior = async () => {
    const de = prevMonth(periodo);
    if (!de) {
      setMensaje({ tipo: 'danger', texto: 'Periodo inválido.' });
      return;
    }
    const ok = confirm(`¿Copiar planilla desde ${de} a ${periodo}?\nSe crearán trabajadores con horas en 0.`);
    if (!ok) return;

    try {
      setCopiando(true);
      await axios.post(`${API}api/trabajadores/copiar`, null, { params: { de, a: periodo } });
      await cargarTrabajadores();
      setMensaje({ tipo: 'success', texto: `Planilla copiada desde ${de}.` });
    } catch (e) {
      console.error(e);
      setMensaje({ tipo: 'danger', texto: 'No se pudo copiar la planilla del mes anterior.' });
    } finally {
      setCopiando(false);
    }
  };

return (
<div className="table-responsive px-3 px-lg-4" style={{ overflowX: 'auto', maxWidth: '100%' }}>
  <table className="table table-bordered table-hover align-middle table-compact mb-0 table-fullwidth">
    {/* Colgroup define el reparto de ancho */}
    <colgroup>
      <col className="table-col-id" />
      <col className="table-col-mes" />
      <col className="table-col-nombre" />
      <col className="table-col-dias" />
      <col className="table-col-htrab" />
      <col className="table-col-hextras" />
      <col className="table-col-retraso" />
      <col className="table-col-observ" />
      <col className="table-col-hacum" />
      <col className="table-col-pct" />
      <col className="table-col-acciones" />
    </colgroup>

    <thead className="table-dark" style={{ lineHeight: 1.1 }}>
      <tr>
        <th className="text-nowrap">ID</th>
        <th className="text-nowrap">MES</th>
        <th>NOMBRE</th>
        <th className="text-nowrap">DIAS<br />TRAB</th>
        <th className="text-nowrap">HORAS<br />TRAB</th>
        <th className="text-nowrap">HORAS<br />EXTRAS</th>
        <th className="text-nowrap">HORAS RETRASO<br />/ PERMISO</th>
        <th className="text-nowrap">OBSERVACIÓN</th>
        <th className="text-nowrap">HORAS ACUM.<br />TRAB</th>
        <th className="text-nowrap">% HORA<br />ASIST</th>
        <th className="text-nowrap">ACCIONES</th>
      </tr>
    </thead>

    <tbody>
      {trabajadores.map((t, idx) => (
        <tr key={t.id ?? `nuevo-${idx}`}>
          <td className="text-nowrap">{t.id ?? '—'}</td>

          <td>
            <input
              type="month"
              className="form-control"
              style={inputStyle}
              value={t.periodo || periodo}
              onChange={(e) => handleChange(idx, 'periodo', e.target.value)}
            />
          </td>

          <td>
            <input
              type="text"
              className="form-control"
              style={inputStyle}
              value={t.nombre ?? ''}
              onChange={(e) => handleChange(idx, 'nombre', e.target.value)}
            />
          </td>

          <td>
            <input
              type="number"
              min="0"
              step="1"
              className="form-control"
              style={inputStyle}
              value={t.dias_trab ?? 0}
              onChange={(e) => handleChange(idx, 'dias_trab', e.target.value)}
            />
          </td>

          <td>
            <input
              type="number"
              className="form-control bg-light"
              style={inputStyle}
              value={t.horas_trab ?? 0}
              readOnly
              tabIndex={-1}
              title="Calculado automáticamente: DIAS TRAB × 9"
            />
          </td>

          <td>
            <input
              type="number"
              min="0"
              step="0.25"
              inputMode="decimal"
              lang="en"
              className="form-control"
              style={inputStyle}
              value={t.horas_extras ?? 0}
              onChange={(e) => handleChange(idx, 'horas_extras', e.target.value)}
            />
          </td>

          <td>
            <input
              type="number"
              min="0"
              step="0.25"
              inputMode="decimal"
              lang="en"
              className="form-control"
              style={inputStyle}
              value={t.horas_retraso ?? 0}
              onChange={(e) => handleChange(idx, 'horas_retraso', e.target.value)}
            />
          </td>

          {/* Observación: si quieres que pueda quebrar en varias líneas, agrega col-wrap */}
          <td className="col-wrap">
            <input
              type="text"
              className="form-control"
              style={inputWide}
              value={t.observacion ?? ''}
              onChange={(e) => handleChange(idx, 'observacion', e.target.value)}
            />
          </td>

          <td>
            <input
              type="number"
              className="form-control bg-light"
              style={inputStyle}
              value={t.horas_acum_trab ?? 0}
              readOnly
              tabIndex={-1}
              title="Calculado: HORAS TRAB + HORAS EXTRAS − HORAS RETRASO / PERMISO"
            />
          </td>

          <td className="text-center" style={{ fontWeight: 600 }}>
            {pctAsistencia(t).toFixed(1)}%
          </td>

          <td>
            <div className="d-flex gap-2">
              <button className="btn btn-success btn-sm" onClick={() => guardarFila(idx)}>
                Guardar
              </button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarFila(idx)}>
                Eliminar
              </button>
            </div>
          </td>
        </tr>
      ))}

      {trabajadores.length === 0 && (
        <tr>
          <td colSpan="11" className="text-center text-muted py-4">
            No hay registros para {periodo}. Crea uno con “Nuevo trabajador” o “Repetir mes anterior”.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
);


};

export default TrabajadoresPage;
