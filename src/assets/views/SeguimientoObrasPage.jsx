import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/SeguimientoObrasPage.css'; // Asegúrate de tener este archivo CSS

const etapasPrincipales = [
  'presupuesto', 'rectificacion', 'accesorios', 'gomas_cepillos', 'herraje',
  'instalacion', 'perfiles', 'refuerzos', 'tornillos', 'vidrio', 'planilla_de_corte',
  'fabricacion', 'acopio', 'despacho', 'instalacion_2', 'recepcion_final', 'pago'
];

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

const SeguimientoObrasPage = () => {
  const [obras, setObras] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:4000/api/seguimiento_obras')
      .then(res => setObras(res.data))
      .catch(err => console.error('Error al cargar seguimiento:', err));
  }, []);

  return (
    <div className="seguimiento-container">
      <h2>Seguimiento de Obras</h2>
      {obras.map((obra) => (
        <div key={obra.id} className="obra">
          <div className="obra-titulo">
            <strong>{obra.cliente_nombre} - {obra.presupuesto_numero} - {obra.nombre_obra}</strong>
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
      ))}
    </div>
  );
};

export default SeguimientoObrasPage;
