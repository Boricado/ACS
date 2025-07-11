import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AjusteStock = () => {
  const [inventario, setInventario] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [ajustes, setAjustes] = useState({});

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${API}api/inventario`)
      .then(res => setInventario(res.data))
      .catch(err => console.error("❌ Error al cargar inventario:", err));

    axios.get(`${API}api/salidas_inventario2`)
      .then(res => setSalidas(res.data))
      .catch(err => console.error("❌ Error al cargar salidas:", err));
  }, []);

  const getSalidas = (codigo) =>
    salidas
      .filter(s => s.codigo === codigo)
      .reduce((sum, s) => sum + parseInt(s.cantidad || 0), 0);

  const handleChange = (codigo, nuevoValor) => {
    setAjustes(prev => ({ ...prev, [codigo]: nuevoValor }));
  };

  const ajustarStock = async (codigo, producto, stockComprado) => {
    const salidasHechas = getSalidas(codigo);
    const stockActual = stockComprado - salidasHechas;
    const real = parseInt(ajustes[codigo] || 0);
    const diferencia = real - stockActual;

    if (diferencia === 0) return;

    try {
      await axios.post(`${API}api/ajuste_stock`, {
        codigo,
        producto,
        diferencia
      });

      alert(`✅ Ajuste realizado por ${Math.abs(diferencia)} unidad${Math.abs(diferencia) === 1 ? '' : 'es'}`);
      
      // Actualizar datos
      const [invRes, salRes] = await Promise.all([
        axios.get(`${API}api/inventario`),
        axios.get(`${API}api/salidas_inventario2`)
      ]);
      setInventario(invRes.data);
      setSalidas(salRes.data);
      setAjustes(prev => ({ ...prev, [codigo]: '' }));

    } catch (err) {
      console.error('❌ Error al ajustar:', err);
      alert('❌ Error al registrar el ajuste');
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">Ajuste de Stock</h2>
      <table className="table table-bordered table-sm align-middle text-center">
        <thead className="table-light">
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Stock Actual</th>
            <th>Stock Real</th>
            <th>Diferencia</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {inventario.length > 0 ? (
            inventario.map(({ codigo, producto, stock_actual }) => {
              const salidasTotales = getSalidas(codigo);
              const stockReal = parseInt(stock_actual) - salidasTotales;
              const real = ajustes[codigo] || '';
              const diferencia = real !== '' ? real - stockReal : '';
              const color = diferencia > 0 ? 'text-success' : diferencia < 0 ? 'text-danger' : '';

              return (
                <tr key={codigo}>
                  <td>{codigo}</td>
                  <td>{producto}</td>
                  <td>{stockReal}</td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={real}
                      onChange={(e) => handleChange(codigo, e.target.value)}
                    />
                  </td>
                  <td className={color}>{diferencia}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={real === '' || diferencia === 0}
                      onClick={() => ajustarStock(codigo, producto, parseInt(stock_actual))}
                    >
                      Ajustar
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6">Cargando productos...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AjusteStock;
