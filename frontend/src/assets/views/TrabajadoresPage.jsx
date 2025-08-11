import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TrabajadoresPage = () => {
  const API = import.meta.env.VITE_API_URL;

  const [trabajadores, setTrabajadores] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [jornadaHoras, setJornadaHoras] = useState(8); // jornada diaria para el % asistencia

  const cargarTrabajadores = async () => {
    try {
      const res = await axios.get(`${API}api/trabajadores`);
      setTrabajadores(res.data || []);
    } catch (e) {
      console.error(e);
      setTrabajadores([]);
    }
  };

  useEffect(() => {
    cargarTrabajadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (idx, field, value) => {
    const next = [...trabajadores];
    // numéricos
    const numericFields = [
      'dias_trab', 'horas_trab', 'horas_extras', 'horas_retraso', 'horas_acum_trab'
    ];
    if (numericFields.includes(field)) {
      const v = value === '' ? '' : Number(value);
      next[idx][field] = isNaN(v) ? '' : v;
    } else {
      next[idx][field] = value;
    }
    setTrabajadores(next);
  };

  const agregarFila = () => {
    setTrabajadores(prev => ([
      ...prev,
      {
        id: null,
        nombre: '',
        dias_trab: 0,
        horas_trab: 0,
        horas_extras: 0,
        horas_retraso: 0,
        observacion: '',
        horas_acum_trab: 0,
      }
    ]));
  };

  const guardarFila = async (idx) => {
    const t = trabajadores[idx];

    // Validaciones simples
    if (!t.nombre?.trim()) {
      setMensaje({ tipo: 'danger', texto: 'El nombre es obligatorio.' });
      return;
    }

    const payload = {
      nombre: t.nombre?.trim(),
      dias_trab: parseInt(t.dias_trab || 0, 10),
      horas_trab: parseFloat(t.horas_trab || 0),
      horas_extras: parseFloat(t.horas_extras || 0),
      horas_retraso: parseFloat(t.horas_retraso || 0),
      observacion: t.observacion || '',
      horas_acum_trab: parseFloat(t.horas_acum_trab || 0),
    };

    try {
      if (t.id) {
        const res = await axios.put(`${API}api/trabajadores/${t.id}`, payload);
        const next = [...trabajadores];
        next[idx] = res.data;
        setTrabajadores(next);
        setMensaje({ tipo: 'success', texto: 'Trabajador actualizado.' });
      } else {
        const res = await axios.post(`${API}api/trabajadores`, payload);
        const next = [...trabajadores];
        next[idx] = res.data;
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

    const pctAsistencia = (t) => {
    const horasAcum = Number(t.horas_acum_trab) || 0;
    const horasTrab = Number(t.horas_trab) || 0;
    if (horasTrab <= 0) return 0;
    return (horasAcum / horasTrab) * 100;
    };


  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">Trabajadores</h3>
        <div className="d-flex align-items-center gap-2">
          <label className="mb-0">Jornada diaria (h):</label>
          <input
            type="number"
            min="1"
            step="0.5"
            value={jornadaHoras}
            onChange={(e) => setJornadaHoras(e.target.value)}
            className="form-control form-control-sm"
            style={{ width: 90 }}
            title="Se usa para calcular % HORA ASIST"
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
              <th style={{width: 70}}>ID</th>
              <th>NOMBRE</th>
              <th style={{width: 120}}>DIAS TRAB</th>
              <th style={{width: 140}}>HORAS TRAB</th>
              <th style={{width: 140}}>HORAS EXTRAS</th>
              <th style={{width: 180}}>HORAS RETRASO / PERMISO</th>
              <th>OBSERVACIÓN</th>
              <th style={{width: 160}}>HORAS ACUM. TRAB</th>
              <th style={{width: 140}}>% HORA ASIST</th>
              <th style={{width: 170}}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {trabajadores.map((t, idx) => (
              <tr key={t.id ?? `nuevo-${idx}`}>
                <td>{t.id ?? '—'}</td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={t.nombre ?? ''}
                    onChange={(e) => handleChange(idx, 'nombre', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-control form-control-sm"
                    value={t.dias_trab ?? 0}
                    onChange={(e) => handleChange(idx, 'dias_trab', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    className="form-control form-control-sm"
                    value={t.horas_trab ?? 0}
                    onChange={(e) => handleChange(idx, 'horas_trab', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    className="form-control form-control-sm"
                    value={t.horas_extras ?? 0}
                    onChange={(e) => handleChange(idx, 'horas_extras', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    className="form-control form-control-sm"
                    value={t.horas_retraso ?? 0}
                    onChange={(e) => handleChange(idx, 'horas_retraso', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={t.observacion ?? ''}
                    onChange={(e) => handleChange(idx, 'observacion', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    className="form-control form-control-sm"
                    value={t.horas_acum_trab ?? 0}
                    onChange={(e) => handleChange(idx, 'horas_acum_trab', e.target.value)}
                  />
                </td>
                <td className="text-center">
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
                <td colSpan="10" className="text-center text-muted py-4">
                  No hay trabajadores. Crea uno con “Nuevo trabajador”.
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
