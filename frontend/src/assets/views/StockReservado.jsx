import React, { useEffect, useState } from 'react';
import axios from 'axios';

const etapas = [
  { key: 'perfiles', tabla: 'ot_pautas_perfiles' },
  { key: 'refuerzos', tabla: 'ot_pautas_refuerzos' },
  { key: 'tornillos', tabla: 'ot_pautas_tornillos' },
  { key: 'herraje', tabla: 'ot_pautas_herraje' },
  { key: 'accesorios', tabla: 'ot_pautas_accesorios' },
  { key: 'gomas_cepillos', tabla: 'ot_pautas_gomascepillos' },
  { key: 'vidrio', tabla: 'ot_pautas_vidrio' },
  { key: 'instalacion', tabla: 'ot_pautas_instalacion' }
];

const API = import.meta.env.VITE_API_URL;

const StockReservado = () => {
  const [obras, setObras] = useState([]);
  const [pautas, setPautas] = useState({});

  useEffect(() => {
    const fetchObras = async () => {
      const res = await axios.get(`${API}api/seguimiento_obras`);
      const obrasFiltradas = res.data.filter(o => !o.recepcion_final);
      setObras(obrasFiltradas);

      for (const etapa of etapas) {
        const result = await axios.get(`${API}api/${etapa.tabla}`);
        setPautas(prev => ({ ...prev, [etapa.key]: result.data }));
      }
    };

    fetchObras();
  }, []);

  const handleToggle = async (tabla, id, nuevoEstado) => {
    try {
      await axios.patch(`${API}api/stock-reservado/${tabla}/${id}`, {
        separado: nuevoEstado
      });
      // Actualiza en frontend local
      setPautas(prev => ({
        ...prev,
        [tabla]: prev[tabla].map(item => item.id === id ? { ...item, separado: nuevoEstado } : item)
      }));
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  };

  useEffect(() => {
  const fetchObras = async () => {
    const res = await axios.get(`${API}api/seguimiento_obras`);
    const obrasFiltradas = res.data.filter(o => !o.recepcion_final);
    setObras(obrasFiltradas);
    console.log('Obras con recepcion_final = false:', obrasFiltradas); // 👈 DEBUG

    for (const etapa of etapas) {
      const result = await axios.get(`${API}api/${etapa.tabla}`);
      console.log(`Datos de ${etapa.key}:`, result.data); // 👈 DEBUG
      setPautas(prev => ({ ...prev, [etapa.key]: result.data }));
    }
  };

  fetchObras();
}, []);


  return (
    <div className="container">
      <h2 className="my-4">Stock Reservado por Proyecto</h2>
      {obras.map((obra, i) => (
        <div key={i} className="mb-4 border rounded p-3">
          <h4>{obra.cliente_nombre} - {obra.nombre_obra}</h4>
          {etapas.map(({ key, tabla }) => {
            const datos = pautas[key]?.filter(p => {
                const match = String(p.numero_presupuesto) === String(obra.presupuesto_numero);
                if (!match && key === 'perfiles') {
                    console.log('No coincide:', {
                    p_num: p.numero_presupuesto,
                    obra_num: obra.presupuesto_numero,
                    p_id: p.id,
                    obra
                    });
                }
                return match;
                }) || [];
                console.log(`Etapa: ${key}, Presupuesto: ${obra.presupuesto_numero}, Ítems filtrados:`, datos);

            if (!datos.length) return null;

            return (
              <div key={key} className="mt-3">
                <h6 className="text-primary text-uppercase">{key.replace('_', ' ')}</h6>
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Material</th>
                      <th>Cantidad</th>
                      <th>Separado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.map(item => (
                      <tr key={item.id}>
                        <td>{item.codigo}</td>
                        <td>{item.producto || item.material || '-'}</td>
                        <td>{item.cantidad}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={item.separado}
                            onChange={() =>
                              handleToggle(tabla, item.id, !item.separado)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default StockReservado;
