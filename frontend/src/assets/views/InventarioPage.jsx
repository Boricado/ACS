// src/views/InventarioPage.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const InventarioPage = () => {
  const [inventario, setInventario] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [mostrarStockCero, setMostrarStockCero] = useState(false);
  const [detalleVisible, setDetalleVisible] = useState(null);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${API}api/inventario`)
      .then(res => setInventario(res.data))
      .catch(err => console.error("❌ Error al cargar inventario:", err));
  }, []);

  const toggleDetalles = (codigo) => {
    setDetalleVisible(detalleVisible === codigo ? null : codigo);
  };

  const inventarioFiltrado = inventario
    .filter(item =>
      (item.codigo || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (item.producto || '').toLowerCase().includes(filtro.toLowerCase())
    )
    .filter(item => mostrarStockCero || parseInt(item.stock_actual) > 0)
    .sort((a, b) => parseInt(b.stock_reservado) - parseInt(a.stock_reservado));

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Stock Actual</h2>

      <div className="mb-3 d-flex justify-content-between align-items-center">
        <input
          type="text"
          className="form-control me-3"
          style={{ maxWidth: '400px' }}
          placeholder="Filtrar por código o producto"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="mostrarStockCero"
            checked={mostrarStockCero}
            onChange={() => setMostrarStockCero(!mostrarStockCero)}
          />
          <label className="form-check-label" htmlFor="mostrarStockCero">
            Mostrar productos con stock 0
          </label>
        </div>
      </div>

      <table className="table table-bordered table-hover table-sm text-center">
        <thead className="table-dark">
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Stock Actual</th>
            <th>Stock Reservado</th>
            <th>Stock Disponible</th>
            <th>Unidad</th>
            <th style={{ borderRight: 'double' }}>Ultimo Precio</th>
            <th style={{ borderLeft: 'double' }}>Stock Mínimo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {inventarioFiltrado.length > 0 ? (
            inventarioFiltrado.map((item, index) => {
              const rowClass = parseInt(item.stock_reservado) > 0 ? 'table-warning' : '';
              const stockReal = parseInt(item.stock_actual);
              const stockReservado = parseInt(item.stock_reservado);
              const stockDisponible = parseInt(item.stock_disponible);

              return (
                <React.Fragment key={index}>
                  <tr className={rowClass} onClick={() => toggleDetalles(item.codigo)}>
                    <td>{item.codigo}</td>
                    <td>{item.producto || '-'}</td>
                    <td>{stockReal}</td>
                    <td>{stockReservado}</td>
                    <td>{stockDisponible}</td>
                    <td>{item.unidad}</td>
                    <td>${item.precio_unitario?.toLocaleString() || '-'}</td>
                    <td>{parseInt(item.stock_minimo)}</td>
                    <td className={
                      stockReal < parseInt(item.stock_minimo)
                        ? 'table-danger'
                        : 'table-success'
                    }>
                      {stockReal < parseInt(item.stock_minimo) ? 'Bajo Stock' : 'OK'}
                    </td>
                  </tr>
                  {detalleVisible === item.codigo && (
                    <tr>
                      <td colSpan="9">
                        <strong>Reservas:</strong>
                        <p>Consulta el backend para ver detalle de reservas activas.</p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan="9">No hay productos para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventarioPage;
