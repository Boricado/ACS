import React, { useEffect, useState } from 'react';
import axios from 'axios';

const InventarioPage = () => {
  const [inventario, setInventario] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [mostrarStockCero, setMostrarStockCero] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:4000/api/inventario')
      .then(res => {
        console.log("📦 Inventario cargado:", res.data);
        setInventario(res.data);
      })
      .catch(err => console.error("❌ Error al cargar inventario:", err));
  }, []);

  const inventarioFiltrado = inventario
    .filter(item =>
      (item.codigo || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (item.producto || '').toLowerCase().includes(filtro.toLowerCase())
    )
    .filter(item => mostrarStockCero || parseInt(item.stock_actual) > 0);

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
            <th>Stock Mínimo</th>
            <th>Unidad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {inventarioFiltrado.length > 0 ? (
            inventarioFiltrado.map((item, index) => (
              <tr key={index}>
                <td>{item.codigo}</td>
                <td>{item.producto || '-'}</td>
                <td>{parseInt(item.stock_actual)}</td>
                <td>{parseInt(item.stock_minimo)}</td>
                <td>{item.unidad}</td>
                <td className={
                  parseInt(item.stock_actual) < parseInt(item.stock_minimo)
                    ? 'table-danger'
                    : 'table-success'
                }>
                  {parseInt(item.stock_actual) < parseInt(item.stock_minimo) ? 'Bajo Stock' : 'OK'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No hay productos para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventarioPage;
