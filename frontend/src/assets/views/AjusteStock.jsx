import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AjusteStock = () => {
  const [inventario, setInventario] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [ajustes, setAjustes] = useState({});
  const [filtro, setFiltro] = useState('');
  const [ordenCampo, setOrdenCampo] = useState('');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [fechasAjuste, setFechasAjuste] = useState({});

  const API = import.meta.env.VITE_API_URL;

  const ordenarPor = (campo) => {
  if (ordenCampo === campo) {
    setOrdenAscendente(!ordenAscendente);
  } else {
    setOrdenCampo(campo);
    setOrdenAscendente(true);
  }
};

  useEffect(() => {
    axios.get(`${API}api/inventario`)
      .then(res => setInventario(res.data))
      .catch(err => console.error("❌ Error al cargar inventario:", err));

    axios.get(`${API}api/salidas_inventario2`)
      .then(res => setSalidas(res.data))
      .catch(err => console.error("❌ Error al cargar salidas:", err));

    axios.get(`${API}api/ajustes_stock`)
    .then(res => setFechasAjuste(res.data))
    .catch(err => console.error("❌ Error al cargar fechas de ajustes:", err));
  }, []);

  const getSalidas = (codigo) =>
    salidas
      .filter(s => s.codigo === codigo)
      .reduce((sum, s) => sum + parseInt(s.cantidad || 0), 0);

  const handleChange = (codigo, nuevoValor) => {
    setAjustes(prev => ({ ...prev, [codigo]: nuevoValor }));
  };
//
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

      // Recargar datos
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

      <div className="mb-3 d-flex justify-content-between">
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: '400px' }}
          placeholder="Buscar por código o producto"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <table className="table table-bordered table-sm align-middle text-center">
        <thead className="table-light">
        <tr>
          <th>Código</th>
          <th onClick={() => ordenarPor('producto')} style={{ cursor: 'pointer' }}>
            Producto {ordenCampo === 'producto' ? (ordenAscendente ? '▲' : '▼') : ''}
          </th>
          <th onClick={() => ordenarPor('stock_actual')} style={{ cursor: 'pointer' }}>
            Stock Actual {ordenCampo === 'stock_actual' ? (ordenAscendente ? '▲' : '▼') : ''}
          </th>
          <th>Stock Real</th>
          <th>Diferencia</th>
          <th>Último Ajuste</th>
          <th>Acción</th>
        </tr>
      </thead>
        <tbody>
          {inventario.length > 0 ? (
            inventario
              .filter(item =>
                (item.codigo || '').toLowerCase().includes(filtro.toLowerCase()) ||
                (item.producto || '').toLowerCase().includes(filtro.toLowerCase())
              )
              .sort((a, b) => {
                if (ordenCampo === 'producto') {
                  return ordenAscendente
                    ? a.producto.localeCompare(b.producto)
                    : b.producto.localeCompare(a.producto);
                } else if (ordenCampo === 'stock_actual') {
                  return ordenAscendente
                    ? a.stock_actual - b.stock_actual
                    : b.stock_actual - a.stock_actual;
                } else {
                  return 0;
                }
              })
              .map(({ codigo, producto, stock_actual }) => {
                const actual = parseInt(stock_actual);
                const real = ajustes[codigo] || '';
                const diferencia = real !== '' ? real - actual : '';
                const color = diferencia > 0 ? 'text-success' : diferencia < 0 ? 'text-danger' : '';

                return (
                  <tr key={codigo}>
                    <td>{codigo}</td>
                    <td>{producto}</td>
                    <td>{actual}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={real}
                        onChange={(e) => handleChange(codigo, e.target.value)}
                      />
                    </td>
                    <td className={color}>{diferencia}</td>
                    <td title={fechasAjuste[codigo] ? new Date(fechasAjuste[codigo]).toLocaleString() : ''}>
                      {fechasAjuste[codigo]
                        ? new Date(fechasAjuste[codigo]).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={real === '' || diferencia === 0}
                        onClick={() => ajustarStock(codigo, producto, actual)}
                      >
                        Ajustar
                      </button>
                    </td>
                  </tr>
                );
              })
          ) : (
            <tr>
              <td colSpan="7">Cargando productos...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AjusteStock;
