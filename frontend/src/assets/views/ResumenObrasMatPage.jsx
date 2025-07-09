// src/views/ResumenObrasMatPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

const ResumenObrasMatPage = () => {
  const [obras, setObras] = useState([]);
  const [detalleVisible, setDetalleVisible] = useState(null);
  const [detalles, setDetalles] = useState({});

  useEffect(() => {
    axios.get(`${API}api/resumen-materiales`)
      .then(res => setObras(res.data))
      .catch(err => console.error('Error al cargar obras:', err));
  }, []);

  const toggleDetalle = async (presupuesto_numero) => {
    if (detalleVisible === presupuesto_numero) {
      setDetalleVisible(null);
      return;
    }

    try {
      const res = await axios.get(`${API}api/resumen-materiales/detalle/${presupuesto_numero}`);
      setDetalles(prev => ({ ...prev, [presupuesto_numero]: res.data }));
      setDetalleVisible(presupuesto_numero);
    } catch (err) {
      console.error('Error al cargar detalles:', err);
    }
  };

  return (
    <div className="container mt-4">
      <h3>Resumen de Obras y Materiales</h3>
      {obras.map((obra, idx) => {
        const detalle = detalles[obra.presupuesto_numero] || [];
        const totalNeto = detalle.reduce((acc, item) => acc + (item.total_neto || 0), 0);
        const iva = Math.round(totalNeto * 0.19);
        const total = totalNeto + iva;
        const utilidad = obra.total_neto_presupuestado
          ? ((obra.total_neto_presupuestado - totalNeto) / obra.total_neto_presupuestado) * 100
          : 0;

        return (
          <div key={idx} className="border rounded p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Cliente:</strong> {obra.cliente_nombre} <br />
                <strong>Presupuesto:</strong> #{obra.presupuesto_numero} - <strong>Obra:</strong> {obra.nombre_obra}<br />
                <strong>Total Neto:</strong> ${totalNeto.toLocaleString()} <br />
                <strong>Presupuestado Neto:</strong> ${obra.total_neto_presupuestado?.toLocaleString() || 0} <br />
                <strong>% Utilidad Neta:</strong> {utilidad.toFixed(1)}%
              </div>
              <button className="btn btn-outline-primary" onClick={() => toggleDetalle(obra.presupuesto_numero)}>
                {detalleVisible === obra.presupuesto_numero ? 'Ocultar' : 'Ver Detalle'}
              </button>
            </div>

            {detalleVisible === obra.presupuesto_numero && (
              <div className="mt-3">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Stock Reservado</th>
                      <th>Stock Llegado</th>
                      <th>Pendiente</th>
                      <th>Unidad</th>
                      <th>Precio</th>
                      <th>Total Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((item, i) => (
                      <tr key={i} style={{ backgroundColor: item.pendiente > 0 ? '#ffe5e5' : 'transparent' }}>
                        <td>{item.codigo}</td>
                        <td>{item.producto}</td>
                        <td>{item.stock_reservado}</td>
                        <td className="text-success">{item.stock_llegado}</td>
                        <td>{item.pendiente}</td>
                        <td>{item.unidad || '-'}</td>
                        <td>${item.precio?.toLocaleString() || 0}</td>
                        <td>${item.total_neto?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-end">
                  <p><strong>Total Neto:</strong> ${totalNeto.toLocaleString()}</p>
                  <p><strong>IVA 19%:</strong> ${iva.toLocaleString()}</p>
                  <p><strong>TOTAL:</strong> ${total.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ResumenObrasMatPage;
