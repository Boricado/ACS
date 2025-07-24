import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/SeguimientoObrasPage.css';
import '../styles/toggleSeguimiento.css';

const etapasPrincipales = [
  'presupuesto', 'rectificacion', 'accesorios', 'gomas_cepillos', 'herraje',
  'perfiles', 'refuerzos', 'tornillos', 'vidrio', 'planilla_corte',
  'fabricacion', 'acopio', 'despacho', 'instalacion', 'recepcion_final', 'pago'
];

const API = import.meta.env.VITE_API_URL;

const agrupaciones = {
  Material: ['perfiles', 'refuerzos', 'tornillos', 'accesorios', 'gomas_cepillos', 'herraje', 'vidrio'],
};

const formatLabel = (key) => {
  const map = {
    instalacion: 'Instalación',
    planilla_corte: 'Planilla de Corte',
    recepcion_final: 'Recepción Final',
    rectificacion: 'Rectificación'
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

const formatFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('T')[0].split('-');
  return `${d}-${m}-${y}`;
};

const calcularFechaMaxima = (fecha, dias) => {
  if (!fecha || !dias) return null;
  const f = new Date(fecha);
  f.setDate(f.getDate() + parseInt(dias));
  return f.toISOString().split('T')[0];
};

const esVencido = (fechaLimite) => {
  if (!fechaLimite) return false;
  return new Date() > new Date(fechaLimite);
};

const esObraCompleta = (obra) => {
  return etapasPrincipales.every(etapa => obra[etapa]);
};

const SeguimientoObrasPage = () => {
  const [obras, setObras] = useState([]);
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false);
  const [comentarioEditado, setComentarioEditado] = useState({});

  useEffect(() => {
    cargarObras();
  }, []);

  const cargarObras = async () => {
    try {
      const res = await axios.get(`${API}api/seguimiento_obras`);
      setObras(res.data);
    } catch (err) {
      console.error('Error al cargar seguimiento:', err);
    }
  };

  const toggleEtapa = async (obra, campo) => {
    try {
      await axios.put(`${API}api/seguimiento_obras/${obra.id}/toggle`, { campo });
      cargarObras();
    } catch (err) {
      console.error(`Error al actualizar etapa ${campo}:`, err);
    }
  };

  const toggleRectificacion = async (obra) => {
    const nuevoEstado = !obra.rectificacion;
    const diasPlazo = obra.rectificacion_plazo_dias || 5;
    try {
      await axios.put(`${API}api/seguimiento_obras/${obra.id}/rectificacion`, {
        rectificacion: nuevoEstado,
        rectificacion_plazo_dias: diasPlazo
      });
      cargarObras();
    } catch (err) {
      console.error('Error al actualizar rectificación:', err);
    }
  };

  const handlePlazoChange = async (obra, nuevoPlazo) => {
    try {
      await axios.put(`${API}api/seguimiento_obras/${obra.id}/rectificacion`, {
        rectificacion: obra.rectificacion,
        rectificacion_plazo_dias: nuevoPlazo
      });
      cargarObras();
    } catch (err) {
      console.error('Error al cambiar días plazo:', err);
    }
  };

  const handleComentarioChange = (id, texto) => {
    setComentarioEditado(prev => ({ ...prev, [id]: texto }));
  };

  const guardarComentario = async (obra) => {
    try {
      await axios.put(`${API}api/seguimiento_obras/${obra.id}/comentario`, {
        comentario: comentarioEditado[obra.id] || ''
      });
      cargarObras();
    } catch (err) {
      console.error('Error al guardar comentario:', err);
    }
  };

  const obrasFiltradas = obras.filter(obra => mostrarCompletadas || !esObraCompleta(obra));

  return (
    <div className="seguimiento-container">
      <h2 className="seguimiento-header">Seguimiento de Obras</h2>

      <div className="mb-3">
        <label>
          <input
            type="checkbox"
            className="form-check-input me-2"
            checked={mostrarCompletadas}
            onChange={() => setMostrarCompletadas(!mostrarCompletadas)}
          />
          Mostrar obras completadas
        </label>
      </div>

      <div className="seguimiento-grid">
        {obrasFiltradas.map((obra) => {
          const fechaMaxima = calcularFechaMaxima(obra.rectificacion_fecha, obra.rectificacion_plazo_dias);
          const vencido = esVencido(fechaMaxima);

          return (
            <div key={obra.id} className="seguimiento-card">
              <div className="seguimiento-titulo">
                <strong>{obra.cliente_nombre} - {obra.presupuesto_numero} - {obra.nombre_obra}</strong>
                {fechaMaxima && (
                  <span className={`seguimiento-fecha ${vencido ? 'vencido' : 'activo'}`}>Fecha Máx: {formatFecha(fechaMaxima)}</span>
                )}
              </div>

              <div className="etapas">
                {etapasPrincipales.map((etapa) => {
                  const agrupacion = Object.entries(agrupaciones).find(([_, subs]) => subs.includes(etapa));
                  if (agrupacion && agrupacion[1][0] === etapa) {
                    return (
                      <div key={agrupacion[0]} className="etapa agrupacion">
                        <div className="etapa-nombre">
                          <span className="arrow">⮞</span> <strong>{agrupacion[0]}</strong>
                        </div>
                        <div className="subetapas">
                          {agrupacion[1].map((sub) => (
                            <div key={sub} className="subetapa">
                              <span className="arrow">↳</span> {formatLabel(sub)} {obra[sub] ? '✅' : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else if (etapa === 'rectificacion') {
                    return (
                      <div key={etapa} className="etapa d-flex align-items-center mb-2">
                        <span className="arrow">⮞</span> {formatLabel(etapa)}
                        <input
                          type="checkbox"
                          className="toggle-switch ms-3"
                          checked={obra.rectificacion || false}
                          onChange={() => toggleRectificacion(obra)}
                        />
                        <input
                          type="number"
                          className="form-control ms-2"
                          style={{ width: '80px' }}
                          value={obra.rectificacion_plazo_dias || 5}
                          onChange={(e) => handlePlazoChange(obra, e.target.value)}
                          title="Días plazo para anotar"
                        />
                      </div>
                    );
                  } else if ([
                    'planilla_corte', 'fabricacion', 'acopio', 'despacho', 'instalacion', 'recepcion_final', 'pago'
                  ].includes(etapa)) {
                    return (
                      <div key={etapa} className="etapa d-flex align-items-center mb-2">
                        <span className="arrow">⮞</span> {formatLabel(etapa)}
                        <input
                          type="checkbox"
                          className="toggle-switch ms-3"
                          checked={obra[etapa] || false}
                          onChange={() => toggleEtapa(obra, etapa)}
                        />
                      </div>
                    );
                  } else if (!Object.values(agrupaciones).some(subs => subs.includes(etapa))) {
                    return (
                      <div key={etapa} className="etapa mb-2">
                        <span className="arrow">⮞</span> {formatLabel(etapa)} {obra[etapa] ? '✅' : ''}
                      </div>
                    );
                  } else {
                    return null;
                  }
                })}

                <div className="seguimiento-comentario mt-3">
                  <label><strong>Comentario:</strong></label>
                  <textarea
                    className="form-control mt-1"
                    value={comentarioEditado[obra.id] ?? obra.comentario ?? ''}
                    onChange={(e) => handleComentarioChange(obra.id, e.target.value)}
                    placeholder="Escribe un comentario..."
                    rows={3}
                  />
                  <button
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => guardarComentario(obra)}
                  >
                    Guardar Comentario
                  </button>
                  {obra.comentario_fecha && (
                    <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                      Última edición: {formatFecha(obra.comentario_fecha)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeguimientoObrasPage;
