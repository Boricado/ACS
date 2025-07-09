// src/views/ResumenObrasMatPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Collapse, Form, Button } from 'react-bootstrap';

const ResumenObrasMatPage = () => {
  const [obras, setObras] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    cargarObras();
  }, []);

  const cargarObras = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/resumen-materiales');
      setObras(res.data);
    } catch (err) {
      console.error('Error al cargar obras:', err);
    }
  };

  const toggleDetalle = async (obra) => {
    const id = obra.id;
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    if (!detalles[id]) {
      try {
        const res = await axios.get(`http://localhost:4000/api/resumen-materiales/detalle/${obra.presupuesto_numero}`);
        setDetalles((prev) => ({ ...prev, [id]: res.data }));
      } catch (err) {
        console.error('Error al obtener detalle de materiales:', err);
      }
    }
  };

  const calcularTotales = (items) => {
    const neto = items.reduce((sum, mat) => sum + mat.total_neto, 0);
    const iva = neto * 0.19;
    const total = neto + iva;
    return { neto, iva, total };
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Resumen de Obras - Materiales y Utilidad</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Presupuesto</th>
            <th>Obra</th>
            <th>Total Neto</th>
            <th>Presupuestado Neto</th>
            <th>% Utilidad</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {obras.map((obra) => {
            const detalle = detalles[obra.id] || [];
            const { neto } = calcularTotales(detalle);
            const utilidad = obra.total_neto_presupuestado > 0 ? ((obra.total_neto_presupuestado - neto) / obra.total_neto_presupuestado * 100).toFixed(1) : '-';

            return (
              <React.Fragment key={obra.id}>
                <tr>
                  <td>{obra.cliente_nombre}</td>
                  <td>{obra.presupuesto_numero}</td>
                  <td>{obra.nombre_obra}</td>
                  <td>${neto.toLocaleString()}</td>
                  <td>
                    <Form.Control
                      type="number"
                      defaultValue={obra.total_neto_presupuestado}
                      disabled
                    />
                  </td>
                  <td>{utilidad !== '-' ? `${utilidad}%` : '-'}</td>
                  <td>
                    <Button size="sm" variant="info" onClick={() => toggleDetalle(obra)}>
                      {expanded[obra.id] ? 'Ocultar' : 'Ver Detalle'}
                    </Button>
                  </td>
                </tr>

                <tr>
                  <td colSpan="7" style={{ padding: 0 }}>
                    <Collapse in={expanded[obra.id]}>
                      <div className="p-3 bg-light">
                        {detalle.length === 0 ? (
                          <p>No hay materiales registrados.</p>
                        ) : (
                          <>
                            <Table size="sm" bordered hover>
                              <thead>
                                <tr>
                                  <th>Código</th>
                                  <th>Producto</th>
                                  <th>Reservado</th>
                                  <th>Llegado</th>
                                  <th>Pendiente</th>
                                  <th>Unidad</th>
                                  <th>Precio</th>
                                  <th>Total Neto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detalle.map((item, idx) => (
                                  <tr
                                    key={idx}
                                    style={item.pendiente > 0 ? { backgroundColor: '#ffe6e6' } : {}}
                                  >
                                    <td>{item.codigo}</td>
                                    <td>{item.producto}</td>
                                    <td>{item.stock_reservado}</td>
                                    <td>{item.stock_llegado}</td>
                                    <td>{item.pendiente}</td>
                                    <td>{item.unidad}</td>
                                    <td>${item.precio?.toLocaleString() || 0}</td>
                                    <td>${item.total_neto?.toLocaleString() || 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>

                            {(() => {
                              const { neto, iva, total } = calcularTotales(detalle);
                              return (
                                <div className="text-end">
                                  <strong>Neto:</strong> ${neto.toLocaleString()}<br />
                                  <strong>IVA 19%:</strong> ${iva.toLocaleString()}<br />
                                  <strong>Total:</strong> ${total.toLocaleString()}
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </Collapse>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default ResumenObrasMatPage;
