import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/SeguimientoObrasPage.css';

const etapasPrincipales = [
  'presupuesto', 'rectificacion', 'accesorios', 'gomas_cepillos', 'herraje',
  'instalacion', 'perfiles', 'refuerzos', 'tornillos', 'vidrio', 'planilla_de_corte',
  'fabricacion', 'acopio', 'despacho', 'instalacion_2', 'recepcion_final', 'pago'
];

const API = import.meta.env.VITE_API_URL;

const agrupaciones = {
  Material: ['perfiles', 'refuerzos', 'tornillos', 'accesorios', 'gomas_cepillos', 'herraje', 'vidrio'],
};

const formatLabel = (key) => {
  const map = {
    instalacion_2: 'Instalación',
    planilla_de_corte: 'Planilla de Corte',
    recepcion_final: 'Recepción Final',
    rectificacion: 'Rectificación'
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
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

const SeguimientoObrasPage = () => {
  const [obras, setObras] = useState([]);

  useEffect(() => {
    axios.get(`${API}api/seguimiento_obras`)
      .then(res => setObras(res.data))
      .catch(err => console.error('Error al cargar seguimiento:', err));
  }, []);

  const toggleRectificacion = async (obra) => {
    const nuevoEstado = !obra.rectificacion;
    const diasPlazo = obra.rectificacion_plazo_dias || 5;
    try {
      await axios.put(`${API}api/seguimiento_obras/${obra.id}/rectificacion`, {
        rectificacion: nuevoEstado,
        rectificacion_plazo_dias: diasPlazo
      });
      const res = await axios.get(`${API}api/seguimiento_obras`);
      setObras(res.data);
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
      const res = await axios.get(`${API}api/seguimiento_obras`);
      setObras(res.data);
    } catch (err) {
      console.error('Error al cambiar días plazo:', err);
    }
  };

  return (
    <div className="seguimiento-container">
      <h2>Seguimiento de Obras</h2>
      {obras.map((obra) => {
        const fechaMaxima = calcularFechaMaxima(obra.rectificacion_fecha, obra.rectificacion_plazo_dias);
        const vencido = esVencido(fechaMaxima);

        return (
          <div key={obra.id} className="obra">
            <div className="obra-titulo">
              <strong>{obra.cliente_nombre} - {obra.presupuesto_numero} - {obra.nombre_obra}</strong>
              {fechaMaxima && (
                <span style={{ marginLeft: '1rem', color: vencido ? 'red' : 'green' }}>
                  Fecha Máx: {fechaMaxima}
                </span>
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
                    <div key={etapa} className="etapa">
                      <span className="arrow">⮞</span> {formatLabel(etapa)}
                      <input
                        type="checkbox"
                        className="form-check-input ms-2"
                        checked={obra.rectificacion || false}
                        onChange={() => toggleRectificacion(obra)}
                      />
                      <input
                        type="number"
                        className="form-control d-inline-block ms-2"
                        style={{ width: '100px' }}
                        value={obra.rectificacion_plazo_dias || 5}
                        onChange={(e) => handlePlazoChange(obra, e.target.value)}
                        title="Días plazo para anotar"
                      />
                    </div>
                  );
                } else if (!Object.values(agrupaciones).some(subs => subs.includes(etapa))) {
                  return (
                    <div key={etapa} className="etapa">
                      <span className="arrow">⮞</span> {formatLabel(etapa)} {obra[etapa] ? '✅' : ''}
                    </div>
                  );
                } else {
                  return null;
                }
              })}

              {obra.comentario && (
                <div className="comentario">
                  <strong>Comentario:</strong> {obra.comentario}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SeguimientoObrasPage;
