// Llamado desde Bodega para crear solicitud de material

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CrearSolicitudBodegaPage = () => {
  const [materiales, setMateriales] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [solicitante, setSolicitante] = useState('');
  const [items, setItems] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const API = import.meta.env.VITE_API_URL;


  useEffect(() => {
    axios.get(`${API}api/materiales`)
      .then(res => setMateriales(res.data))
      .catch(err => console.error('Error al cargar materiales', err));
  }, []);

  const handleCodigoChange = (e) => {
    const value = e.target.value;
    setCodigo(value);
    const mat = materiales.find(m => m.codigo === value);
    setProducto(mat ? mat.producto : '');
  };

  const handleProductoChange = (e) => {
    const value = e.target.value;
    setProducto(value);
    const mat = materiales.find(m => m.producto === value);
    setCodigo(mat ? mat.codigo : '');
  };

  const handleAgregarItem = (e) => {
    e.preventDefault();
    if (!codigo || !producto || !cantidad || !solicitante) return;
    setItems([...items, { codigo, producto, cantidad: parseInt(cantidad), solicitante }]);
    setCodigo('');
    setProducto('');
    setCantidad(1);
  };

  const handleEnviarSolicitud = async () => {
    try {
      await Promise.all(items.map(item =>
        axios.post(`${API}api/solicitudes`, item)
      ));
      setMensaje('Solicitud enviada correctamente.');
      setItems([]);
      setSolicitante('');
    } catch (err) {
      console.error('Error al guardar solicitud:', err);
      setMensaje('Hubo un error al guardar la solicitud.');
    }
  };

  const handleEditarItem = (index, field, value) => {
    const nuevosItems = [...items];
    nuevosItems[index][field] = value;
    setItems(nuevosItems);
  };

  const handleEliminarItem = (index) => {
    const nuevosItems = [...items];
    nuevosItems.splice(index, 1);
    setItems(nuevosItems);
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Crear Solicitud de Bodega</h2>

      {mensaje && (
        <div className={`alert ${mensaje.includes('correctamente') ? 'alert-success' : 'alert-danger'}`}>
            {mensaje}
        </div>
        )}

      <form onSubmit={handleAgregarItem} className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Código</label>
          <input
            type="text"
            className="form-control"
            list="codigos"
            value={codigo}
            onChange={handleCodigoChange}
            required
          />
          <datalist id="codigos">
            {materiales.map((m, i) => (
              <option key={i} value={m.codigo} />
            ))}
          </datalist>
        </div>

        <div className="col-md-6">
          <label className="form-label">Producto</label>
          <input
            type="text"
            className="form-control"
            list="productos"
            value={producto}
            onChange={handleProductoChange}
            required
          />
          <datalist id="productos">
            {materiales.map((m, i) => (
              <option key={i} value={m.producto} />
            ))}
          </datalist>
        </div>

        <div className="col-md-6">
          <label className="form-label">Cantidad</label>
          <input
            type="number"
            className="form-control"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Solicitante</label>
          <input
            type="text"
            className="form-control"
            value={solicitante}
            onChange={(e) => setSolicitante(e.target.value)}
            required
          />
        </div>

        <div className="col-12 text-center">
          <button type="submit" className="btn btn-success">Añadir Item</button>
        </div>
      </form>

      {items.length > 0 && (
        <div className="mt-4">
          <h5>Items Solicitados</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Solicitante</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.codigo}</td>
                  <td>{item.producto}</td>
                  <td>
                    <input
                      type="number"
                      value={item.cantidad}
                      className="form-control"
                      onChange={(e) => handleEditarItem(index, 'cantidad', e.target.value)}
                    />
                  </td>
                  <td>{item.solicitante}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleEliminarItem(index)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-center">
            <button className="btn btn-primary" onClick={handleEnviarSolicitud}>Enviar Solicitud</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrearSolicitudBodegaPage;