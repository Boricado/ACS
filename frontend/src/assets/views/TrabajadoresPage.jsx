import React, { useEffect, useState } from 'react';
import axios from 'axios';

const JORNADA_DIARIA = 9; // ← DIAS TRAB * 9

const inputStyle = {
  minWidth: 110,
  minHeight: 38,
  fontSize: '0.95rem',
  backgroundColor: '#fff'
};
const inputWide = { ...inputStyle, minWidth: 220 };

const TrabajadoresPage = () => {
  const API = import.meta.env.VITE_API_URL;

  const periodoActual = new Date().toISOString().slice(0, 7);
  const [periodo, setPeriodo] = useState(periodoActual);

  const [trabajadores, setTrabajadores] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  const cargarTrabajadores = async () => {
    try {
      const res = await axios.get(`${API}api/trabajadores`, { params: { periodo } });
      // Aseguramos que los derivados estén coherentes al cargar
      const recalculados = (res.data || []).map(recalcDerivados);
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

  // Recalcular campos derivados a partir de una fila
  const recalcDerivados = (t) => {
    const dias = Number(t.dias_trab) || 0;
    const extras = Number(t.horas_extras) || 0;
    const retraso = Number(t.horas_retraso) || 0;
    const horas_trab = Math.max(0, dias * JORNADA_DIARIA);
    const horas_acum_trab = Math.max(0, horas_trab + extras - retraso);
    return { ...t, horas_trab, horas_acum_trab };
  };

  const handleChange = (idx, field, value) => {
    const next = [...trabajadores];

    // Normaliza numéricos
    const numericFields = ['dias_trab', 'horas_extras', 'horas_retraso'];
    if (numericFields.includes(field)) {
      const v = value === '' ? '' : Number(value);
      next[idx][field] = isNaN(v) ? '' : v;
    } else if (field === 'periodo' || field === 'nombre' || field === 'observacion') {
      next[idx][field] = value;
    } else {
      next[idx][field] = value;
    }

    // Recalcula derivados
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
    const t = recalcDerivados(trabajadores[idx]); // asegurar consistencia antes de guardar

    if (!t.nombre?.trim()) {
      setMensaje({ tipo: 'danger', texto: 'El nombre es obligatorio.' });
      return;
    }

    const payload = {
      periodo: t.periodo || periodo,
      nombre: t.nombre?.trim(),
      dias_trab: parseInt(t.dias_trab || 0, 10),
      horas_trab: Number(t.horas_trab || 0),               // derivado
      horas_extras: Number(t.horas_extras || 0),
      horas_retraso: Number(t.horas_retraso || 0),
      observacion: t.observacion || '',
      horas_acum_trab: Number(t.horas_acum_trab || 0)      // derivado
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

  // % HORA ASIST = (HORAS ACUM. TRAB / HORAS TRAB) * 100
  const pctAsistencia = (t) => {
    const horasAcum = Number(t.horas_acum_trab) || 0;
    const horasTrab = Number(t.horas_trab) || 0;
    if (horasTrab <= 0) return 0;
    return (horasAcum / horasTrab) * 100; // si quieres, limita a 0..100 con Math.min/Math.max
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">Trabajadores</h3>
        <div className="d-flex align-items-center gap-2">
          <label className="mb-0">Mes:</label>
          <input
            type="month"
            className="form-control form-control-sm"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            style={{ width: 170, minHeight: 38, fontSize: '0.95rem' }}
          />
          <button className="btn btn-primary" onClick={agregarFila}>
            Nuevo trabajador
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo}`} role="alert">
          {mensaje.texto}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th style={{ minWidth: 70 }}>ID</th>
              <th style={{ minWidth: 150 }}>MES</th>
              <th style={{ minWidth: 180 }}>NOMBRE</th>
              <th style={{ minWidth: 120 }}>DIAS TRAB</th>
              <th style={{ minWidth: 140 }}>HORAS TRAB</th>
              <th style={{ minWidth: 140 }}>HORAS EXTRAS</th>
              <th style={{ minWidth: 190 }}>HORAS RETRASO / PERMISO</th>
              <th style={{ minWidth: 220 }}>OBSERVACIÓN</th>
              <th style={{ minWidth: 170 }}>HORAS ACUM. TRAB</th>
              <th style={{ minWidth: 140 }}>% HORA ASIST</th>
              <th style={{ minWidth: 170 }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {trabajadores.map((t, idx) => (
              <tr key={t.id ?? `nuevo-${idx}`}>
                <td>{t.id ?? '—'}</td>

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
                    className="form-control"
                    style={inputStyle}
                    value={t.horas_retraso ?? 0}
                    onChange={(e) => handleChange(idx, 'horas_retraso', e.target.value)}
                  />
                </td>

                <td>
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
                  No hay registros para {periodo}. Crea uno con “Nuevo trabajador”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrabajadoresPage;
