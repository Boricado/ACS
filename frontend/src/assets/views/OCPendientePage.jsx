import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

  const filtrarOrdenes = ordenes.filter(o =>
    o.numero_oc.toLowerCase().includes(filtro.numero_oc.toLowerCase()) &&
    o.numero_presupuesto?.toString().includes(filtro.numero_presupuesto) &&
    o.proveedor.toLowerCase().includes(filtro.proveedor.toLowerCase()) &&
    o.observacion?.toLowerCase().includes(filtro.observacion.toLowerCase())
  );

  const toggleDetalle = (numero_oc) => {
    setDetallesVisibles(prev => ({
      ...prev,
      [numero_oc]: !prev[numero_oc]
    }));
  };

  return (
    <div className="container mt-4">
      <h4>Órdenes de Compra</h4>

      <div className="d-flex mb-3 gap-2">
        <input name="numero_oc" className="form-control" placeholder="N° OC" value={filtro.numero_oc} onChange={handleFiltroChange} />
        <input name="numero_presupuesto" className="form-control" placeholder="N° Presupuesto" value={filtro.numero_presupuesto} onChange={handleFiltroChange} />
        <input name="proveedor" className="form-control" placeholder="Proveedor" value={filtro.proveedor} onChange={handleFiltroChange} />
        <input name="observacion" className="form-control" placeholder="Observación" value={filtro.observacion} onChange={handleFiltroChange} />
        <select name="estado" className="form-select" value={filtro.estado} onChange={handleFiltroChange}>
          <option>Pendiente</option>
          <option>Completa</option>
          <option>Todas</option>
        </select>
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
                <td>{o.fecha}</td>
                <td>{o.observacion}</td>
              </tr>
              {detallesVisibles[o.numero_oc] && o.detalles && (
                <tr>
                  <td colSpan="4">
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Producto</th>
                          <th>Cantidad Total</th>
                          <th>Precio Unitario</th>
                          <th>Cant. Llegadas</th>
                          <th>Cant. Pendientes</th>
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
                              <td>${d.precio_unitario?.toLocaleString()}</td>
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
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="text-end">
                      <p><strong>Total Neto:</strong> ${o.total_neto?.toLocaleString()}</p>
                      <p><strong>IVA 19%:</strong> ${Math.round((o.total_neto || 0) * 0.19).toLocaleString()}</p>
                      <p><strong>Total:</strong> ${(Math.round((o.total_neto || 0) * 1.19)).toLocaleString()}</p>
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
