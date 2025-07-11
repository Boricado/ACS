import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AjusteStock = () => {
  const [datos, setDatos] = useState([]);
  const [ajustes, setAjustes] = useState({});

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const res = await axios.get('/api/vista_stock_actual');
        setDatos(res.data);
      } catch (err) {
        console.error('Error al cargar stock:', err);
      }
    };

    fetchDatos();
  }, []);

  const handleChange = (codigo, valor) => {
    setAjustes(prev => ({ ...prev, [codigo]: valor }));
  };

  const ajustarStock = async (codigo, producto, stockActual) => {
    const real = parseInt(ajustes[codigo] || 0);
    const diferencia = real - stockActual;
    if (diferencia === 0) return;

    try {
      await axios.post('/api/ajuste_stock', {
        codigo,
        producto,
        diferencia
      });
      alert(`Ajuste de ${diferencia > 0 ? 'entrada' : 'salida'} realizado por ${Math.abs(diferencia)} unidades`);
      // Actualiza datos luego del ajuste
      const res = await axios.get('/api/vista_stock_actual');
      setDatos(res.data);
      setAjustes(prev => ({ ...prev, [codigo]: '' }));
    } catch (err) {
      console.error('Error al registrar ajuste:', err);
      alert('❌ Error al registrar el ajuste');
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Ajuste de Stock</h2>
      <table className="table table-bordered table-sm align-middle">
        <thead className="table-light">
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Stock Actual</th>
            <th>Stock Real</th>
            <th>Diferencia</th>
            <th>Ajustar</th>
          </tr>
        </thead>
        <tbody>
          {datos.map(({ codigo, producto, stock_actual }) => {
            const real = ajustes[codigo] || '';
            const diferencia = real !== '' ? real - stock_actual : '';
            const color = diferencia > 0 ? 'text-success' : diferencia < 0 ? 'text-danger' : '';
            return (
              <tr key={codigo}>
                <td>{codigo}</td>
                <td>{producto}</td>
                <td>{stock_actual}</td>
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
                    className="btn btn-primary btn-sm"
                    onClick={() => ajustarStock(codigo, producto, stock_actual)}
                    disabled={real === '' || diferencia === 0}
                  >
                    Ajustar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AjusteStock;
