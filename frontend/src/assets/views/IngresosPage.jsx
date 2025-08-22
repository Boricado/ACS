import React, { useEffect, useState } from 'react';
import axios from 'axios';

const IngresosPage = () => {
  const [ordenes, setOrdenes] = useState([]);
  const API = import.meta.env.VITE_API_URL;

  const [filtro, setFiltro] = useState({
    numero_oc: '',
    proveedor: '',
    codigo: '',
    material: '',
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
      setOrdenes(res.data || []);
    } catch (err) {
      console.error('Error al cargar órdenes pendientes:', err);
    }
  };

  const handleFiltroChange = (e) => {
    setFiltro({ ...filtro, [e.target.name]: e.target.value });
  };

  const toggleDetalle = (numero_oc) => {
    setDetallesVisibles((prev) => ({
      ...prev,
      [numero_oc]: !prev[numero_oc],
    }));
  };

  // Actualiza un campo de una línea de detalle
  const handleInputChange = (oc, idx, field, value) => {
    setOrdenes((prev) =>
      prev.map((o) =>
        o.numero_oc !== oc
          ? o
          : {
              ...o,
              detalles: o.detalles.map((item, i) =>
                i !== idx
                  ? item
                  : {
                      ...item,
                      [field]:
                        field === 'precio_unitario' || field === 'cantidad_llegada'
                          ? parseFloat(value) || 0
                          : value,
                    }
              ),
            }
      )
    );
  };

  const calcularTotales = (detalles = []) => {
    let totalNeto = 0;
    detalles.forEach((d) => {
      const total = (d.cantidad_llegada || 0) * (d.precio_unitario || 0);
      totalNeto += total;
    });
    const iva = Math.round(totalNeto * 0.19);
    const total = totalNeto + iva;
    return { totalNeto, iva, total };
  };

  const filtrarOrdenes = ordenes.filter((o) =>
    o.numero_oc.toString().includes(filtro.numero_oc) &&
    (o.proveedor || '').toLowerCase().includes(filtro.proveedor.toLowerCase()) &&
    (o.observacion || '').toLowerCase().includes(filtro.observacion.toLowerCase()) &&
    (filtro.codigo
      ? o.detalles?.some((d) => (d.codigo || '').toLowerCase().includes(filtro.codigo.toLowerCase()))
      : true) &&
    (filtro.material
      ? o.detalles?.some((d) => (d.producto || '').toLowerCase().includes(filtro.material.toLowerCase()))
      : true)
  );

  const handleIngresarFactura = async (numeroOC) => {
    const orden = ordenes.find((o) => o.numero_oc === numeroOC);

    if (!orden?.factura || !orden?.fecha_factura) {
      alert(`Debe ingresar número y fecha de factura para la OC ${numeroOC}`);
      return;
    }

    try {
      // Enviar observacion_ingreso por cada detalle
      const ordenActualizada = {
        ...orden,
        detalles: (orden.detalles || []).map((d) => ({
          ...d,
          observacion_ingreso: d.observacion_ingreso || '', // <-- clave
        })),
      };

      await axios.post(`${API}api/ingresar_factura`, { ordenes: [ordenActualizada] });
      alert(`Factura OC ${numeroOC} ingresada exitosamente.`);
      await cargarOrdenesPendientes();
    } catch (err) {
      console.error('Error al ingresar factura:', err);
      alert('Hubo un error al ingresar la factura.');
    }
  };

  return (
    <div className="container mt-4">
      <h4>Ingresos de Inventario</h4>

      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4 col-lg-2">
          <input
            name="numero_oc"
            className="form-control"
            placeholder="N° OC"
            value={filtro.numero_oc}
            onChange={handleFiltroChange}
          />
        </div>
        <div className="col-12 col-md-4 col-lg-2">
          <input
            name="proveedor"
            className="form-control"
            placeholder="Proveedor"
            value={filtro.proveedor}
            onChange={handleFiltroChange}
          />
        </div>
        <div className="col-12 col-md-4 col-lg-2">
          <input
            name="codigo"
            className="form-control"
            placeholder="Código"
            value={filtro.codigo || ''}
            onChange={handleFiltroChange}
          />
        </div>
        <div className="col-12 col-md-4 col-lg-2">
          <input
            name="material"
            className="form-control"
            placeholder="Material"
            value={filtro.material || ''}
            onChange={handleFiltroChange}
          />
        </div>
        <div className="col-12 col-md-4 col-lg-2">
          <input
            name="observacion"
            className="form-control"
            placeholder="Obra"
            value={filtro.observacion}
            onChange={handleFiltroChange}
          />
        </div>
        <div className="col-12 col-md-4 col-lg-2">
          <select className="form-select" disabled>
            <option>Pendiente</option>
          </select>
        </div>
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
                    setOrdenes((prev) =>
                      prev.map((oc) =>
                        oc.numero_oc === o.numero_oc ? { ...oc, factura: e.target.value } : oc
                      )
                    )
                  }
                />
              </div>
              <div className="col-md-6">
                <label>Fecha Factura</label>
                <div className="input-group">
                  <input
                    type="date"
                    className="form-control"
                    value={o.fecha_factura ? new Date(o.fecha_factura).toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      setOrdenes((prev) =>
                        prev.map((oc) =>
                          oc.numero_oc === o.numero_oc ? { ...oc, fecha_factura: e.target.value } : oc
                        )
                      )
                    }
                  />
                  <button className="btn btn-primary" onClick={() => handleIngresarFactura(o.numero_oc)}>
                    Ingresar
                  </button>
                </div>
              </div>
            </div>

            {detallesVisibles[o.numero_oc] && (
              <div className="mt-3">
                <div className="table-responsive">
                  <table className="table table-bordered table-sm text-center mb-0">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Cantidad Total</th>
                        <th>Precio Unitario</th>
                        <th>Cant. Llegadas</th>
                        <th style={{ minWidth: 220 }}>Comentario</th>{/* NUEVO */}
                        <th>Total Neto</th>
                        <th>Cant. Pendientes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(o.detalles || []).map((d, idx) => {
                        const totalNetoLinea = (d.cantidad_llegada || 0) * (d.precio_unitario || 0);
                        const pendientes = (d.cantidad || 0) - (d.cantidad_llegada || 0);
                        return (
                          <tr key={idx}>
                            <td>{d.codigo}</td>
                            <td className="text-start">{d.producto}</td>
                            <td>{d.cantidad}</td>

                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={d.precio_unitario}
                                onChange={(e) =>
                                  handleInputChange(o.numero_oc, idx, 'precio_unitario', e.target.value)
                                }
                              />
                            </td>

                            <td>
                              <input
                                type="number"
                                className={`form-control form-control-sm text-center bg-${
                                  pendientes === 0 ? 'success' : 'secondary'
                                } text-white`}
                                value={d.cantidad_llegada || ''}
                                onChange={(e) =>
                                  handleInputChange(o.numero_oc, idx, 'cantidad_llegada', e.target.value)
                                }
                              />
                            </td>

                            {/* NUEVO: Comentario por ítem (observacion_ingreso) */}
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Comentario de ingreso"
                                value={d.observacion_ingreso || ''}
                                onChange={(e) =>
                                  handleInputChange(o.numero_oc, idx, 'observacion_ingreso', e.target.value)
                                }
                              />
                            </td>

                            <td>${(totalNetoLinea || 0).toLocaleString()}</td>

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
                </div>

                <div className="text-end mt-2">
                  <p>
                    <strong>Total Neto:</strong> ${totalNeto.toLocaleString()}
                  </p>
                  <p>
                    <strong>IVA 19%:</strong> ${iva.toLocaleString()}
                  </p>
                  <p>
                    <strong>Total:</strong> ${total.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default IngresosPage;
