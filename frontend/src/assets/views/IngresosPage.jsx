
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const IngresosPage = () => {
  const [ordenes, setOrdenes] = useState([]);
  const API = import.meta.env.VITE_API_URL;
  const [filtro, setFiltro] = useState({
    numero_oc: '',
    proveedor: '',
    observacion: '',
  });
  const [detallesVisibles, setDetallesVisibles] = useState({});

  useEffect(() => {
    cargarOrdenesPendientes();
  }, []);

  const cargarOrdenesPendientes = async () => {
    try {
      const res = await axios.get(`${API}api/ordenes_compra_estado`, {
        params: { estado: 'PENDIENTE' },
      });
      setOrdenes(res.data);
    } catch (err) {
      console.error('Error al cargar órdenes pendientes:', err);
    }
  };

  const handleFiltroChange = (e) => {
    setFiltro({ ...filtro, [e.target.name]: e.target.value });
  };

  const toggleDetalle = (numero_oc) => {
    setDetallesVisibles(prev => ({
      ...prev,
      [numero_oc]: !prev[numero_oc]
    }));
  };

  const handleInputChange = (oc, idx, field, value) => {
    setOrdenes(prev =>
      prev.map(o =>
        o.numero_oc !== oc
          ? o
          : {
              ...o,
              detalles: o.detalles.map((item, i) =>
                i !== idx
                  ? item
                  : {
                      ...item,
                      [field]: field === 'precio_unitario' || field === 'cantidad_llegada'
                        ? parseFloat(value) || 0
                        : value
                    }
              )
            }
      )
    );
  };

  const calcularTotales = (detalles) => {
    let totalNeto = 0;
    detalles.forEach(d => {
      const total = (d.cantidad_llegada || 0) * (d.precio_unitario || 0);
      totalNeto += total;
    });
    const iva = Math.round(totalNeto * 0.19);
    const total = totalNeto + iva;
    return { totalNeto, iva, total };
  };

  const filtrarOrdenes = ordenes.filter(o =>
    o.numero_oc.toString().includes(filtro.numero_oc) &&
    o.proveedor.toLowerCase().includes(filtro.proveedor.toLowerCase()) &&
    o.observacion?.toLowerCase().includes(filtro.observacion.toLowerCase())
  );

  const handleIngresarFactura = async () => {
    try {
      const ordenesAEnviar = ordenes.map(orden => ({
        ...orden,
        factura: orden.factura || '',
        fecha_factura: orden.fecha_factura || '',
        detalles: orden.detalles.map(d => ({
          ...d,
          observacion: d.observacion || orden.observacion
        }))
      }));

      await axios.post(`${API}api/ingresar_factura`, { ordenes: ordenesAEnviar });
      alert('Factura ingresada exitosamente.');
      await cargarOrdenesPendientes();
    } catch (err) {
      console.error('Error al ingresar factura:', err);
      alert('Hubo un error al ingresar la factura.');
    }
  };

  return (
    <div className="container mt-4">
      <h4>Ingresos de Inventario</h4>

      <div className="d-flex mb-3 gap-2">
        <input name="numero_oc" className="form-control" placeholder="N° OC" value={filtro.numero_oc} onChange={handleFiltroChange} />
        <input name="proveedor" className="form-control" placeholder="Proveedor" value={filtro.proveedor} onChange={handleFiltroChange} />
        <input name="observacion" className="form-control" placeholder="Obra" value={filtro.observacion} onChange={handleFiltroChange} />
        <select className="form-select" disabled>
          <option>Pendiente</option>
        </select>
      </div>

      {filtrarOrdenes.map((o, i) => {
        const { totalNeto, iva, total } = calcularTotales(o.detalles);
        return (
          <div key={i} className="mb-4 border rounded p-3 bg-light text-start">
            <div onClick={() => toggleDetalle(o.numero_oc)} style={{ cursor: 'pointer' }}>
              <strong>N° OC:</strong> {o.numero_oc} &nbsp;|&nbsp;
              <strong>Proveedor:</strong> {o.proveedor} &nbsp;|&nbsp;
              <strong>Fecha:</strong> {o.fecha} &nbsp;|&nbsp;
              <strong>Obra:</strong> {o.observacion}
            </div>

            <div className="row mt-2 mb-3">
              <div className="col-md-6">
                <label>N° Factura</label>
                <input
                  type="text"
                  className="form-control"
                  value={o.factura || ''}
                  onChange={(e) =>
                    setOrdenes(prev =>
                      prev.map(oc => oc.numero_oc === o.numero_oc
                        ? { ...oc, factura: e.target.value }
                        : oc)
                    )
                  }
                />
              </div>
              <div className="col-md-6">
                <label>Fecha Factura</label>
                <input
                  type="date"
                  className="form-control"
                  value={o.fecha_factura ? new Date(o.fecha_factura).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setOrdenes(prev =>
                      prev.map(oc => oc.numero_oc === o.numero_oc
                        ? { ...oc, fecha_factura: e.target.value }
                        : oc)
                    )
                  }
                />
              </div>
            </div>

            {detallesVisibles[o.numero_oc] && (
              <div className="mt-3">
                <table className="table table-bordered table-sm text-center">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Cantidad Total</th>
                      <th>Precio Unitario</th>
                      <th>Cant. Llegadas</th>
                      <th>Total Neto</th>
                      <th>Cant. Pendientes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.detalles.map((d, idx) => {
                      const totalNeto = (d.cantidad_llegada || 0) * (d.precio_unitario || 0);
                      const pendientes = (d.cantidad || 0) - (d.cantidad_llegada || 0);
                      return (
                        <tr key={idx}>
                          <td>{d.codigo}</td>
                          <td>{d.producto}</td>
                          <td>{d.cantidad}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={d.precio_unitario}
                              onChange={(e) => handleInputChange(o.numero_oc, idx, 'precio_unitario', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className={`form-control form-control-sm text-center bg-${pendientes === 0 ? 'success' : 'secondary'} text-white`}
                              value={d.cantidad_llegada || ''}
                              onChange={(e) => handleInputChange(o.numero_oc, idx, 'cantidad_llegada', e.target.value)}
                            />
                          </td>
                          <td>${totalNeto.toLocaleString()}</td>
                          <td>
                            <span className={`badge bg-${pendientes > 0 ? 'danger' : 'success'}`}>
                              {pendientes} {pendientes > 0 ? '⚠️' : '✔️'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="text-end">
                  <p><strong>Total Neto:</strong> ${totalNeto.toLocaleString()}</p>
                  <p><strong>IVA 19%:</strong> ${iva.toLocaleString()}</p>
                  <p><strong>Total:</strong> ${total.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="text-end">
        <button className="btn btn-primary" onClick={handleIngresarFactura}>
          Ingresar Factura
        </button>
      </div>
    </div>
  );
};

export default IngresosPage;
