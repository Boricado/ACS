// frontend/src/assets/views/AjusteStock.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AjusteStock = () => {
  const [inventario, setInventario] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [ajustes, setAjustes] = useState({});
  const [nombresEditados, setNombresEditados] = useState({});
  const [filtro, setFiltro] = useState('');
  const [ordenCampo, setOrdenCampo] = useState('');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [fechasAjuste, setFechasAjuste] = useState({});

  const API = import.meta.env.VITE_API_URL;

  // Obtiene el nombre del usuario logueado desde localStorage o JWT
  const getUsuario = () => {
    try {
      const direct = localStorage.getItem('usuarioNombre');
      if (direct && direct.trim()) return direct.trim();

      const token = localStorage.getItem('token');
      if (token && token.split('.').length === 3) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return (payload.nombre || payload.name || payload.username || payload.email || 'Usuario').toString();
      }
    } catch (_) {}
    return 'Usuario';
  };

  const ordenarPor = (campo) => {
    if (ordenCampo === campo) {
      setOrdenAscendente(!ordenAscendente);
    } else {
      setOrdenCampo(campo);
      setOrdenAscendente(true);
    }
  };

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const [inv, sal, fec] = await Promise.all([
          axios.get(`${API}api/inventario`),
          axios.get(`${API}api/salidas_inventario2`),
          axios.get(`${API}api/ajuste_stock`)
        ]);
        setInventario(inv.data || []);
        setSalidas(sal.data || []);
        setFechasAjuste(fec.data || {});
      } catch (err) {
        console.error('❌ Error al cargar datos:', err);
      }
    };
    cargarTodo();
  }, [API]);

  const handleChange = (codigo, nuevoValor) => {
    setAjustes((prev) => ({ ...prev, [codigo]: nuevoValor }));
  };

  // ---- Nombre editable ----
  const handleNombreChange = (codigo, nuevoNombre) => {
    setNombresEditados((prev) => ({ ...prev, [codigo]: nuevoNombre }));
  };

  const guardarNombre = async (codigo, nombreOriginal) => {
    const nuevoNombre = (nombresEditados[codigo] ?? nombreOriginal).trim();
    if (!nuevoNombre) {
      alert('El nombre no puede estar vacío.');
      return;
    }
    if (nuevoNombre === nombreOriginal) return;

    try {
      await axios.put(`${API}api/ajuste_stock/materiales/${encodeURIComponent(codigo)}/nombre`, {
      producto: nuevoNombre
      });

      setInventario((prev) =>
        prev.map((item) =>
          item.codigo === codigo ? { ...item, producto: nuevoNombre } : item
        )
      );

      setNombresEditados((prev) => {
        const { [codigo]: _omit, ...rest } = prev;
        return rest;
      });

      alert('✅ Nombre de producto actualizado.');
    } catch (err) {
      console.error('❌ Error al actualizar nombre:', err);
      alert('❌ Error al actualizar el nombre del producto.');
    }
  };
  // -------------------------

  const ajustarStock = async (codigo, producto, stockActual) => {
    const real = parseInt(ajustes[codigo] || 0, 10);
    const diferencia = real - (parseInt(stockActual, 10) || 0);

    if (Number.isNaN(real)) {
      alert('Ingresa un número válido en Stock Real.');
      return;
    }
    if (diferencia === 0) return;

    const usuario = getUsuario();
    const nombreFinal = (nombresEditados[codigo] ?? producto).trim() || producto;

    try {
      await axios.post(`${API}api/ajuste_stock`, {
        codigo,
        producto: nombreFinal,
        diferencia,
        usuario // ⬅️ Enviamos el usuario al backend
      });

      // Reflejar de inmediato el "Último Ajuste" sin recargar:
      const hoy = new Date();
      const fechaISO = hoy.toISOString().split('T')[0]; // YYYY-MM-DD
      const fechaAjusteTexto = fechaISO.split('-').reverse().join('-'); // DD-MM-YYYY

      setFechasAjuste((prev) => ({
        ...prev,
        [codigo]: {
          fecha: fechaISO,
          comentario: `Ajuste ${fechaAjusteTexto} • ${usuario}`
        }
      }));

      alert(
        `✅ Ajuste realizado por ${Math.abs(diferencia)} unidad${
          Math.abs(diferencia) === 1 ? '' : 'es'
        }`
      );

      // Recargar inventario/stock (no hace falta volver a pedir /api/ajuste_stock)
      const [invRes, salRes] = await Promise.all([
        axios.get(`${API}api/ajuste_stock/inventario_join`),
        axios.get(`${API}api/salidas_inventario2`)
      ]);
      setInventario(invRes.data || []);
      setSalidas(salRes.data || []);
      setAjustes((prev) => ({ ...prev, [codigo]: '' }));
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

    <div className="table-responsive" style={{ maxWidth: '100%', overflowX: 'auto' }}>
      <table className="table table-bordered table-sm align-middle text-center mb-0 table-fullwidth">
          <colgroup>
            <col style={{ width: '12%' }} /> {/* Código */}
            <col style={{ width: '40%' }} /> {/* Producto */}
            <col style={{ width: '8%'  }} /> {/* Stock Actual */}
            <col style={{ width: '12%' }} /> {/* Stock Real */}
            <col style={{ width: '10%' }} /> {/* Diferencia */}
            <col style={{ width: '12%' }} /> {/* Último Ajuste */}
            <col style={{ width: '6%'  }} /> {/* Acción */}
          </colgroup>
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
              .filter(
                (item) =>
                  (item.codigo || '').toLowerCase().includes(filtro.toLowerCase()) ||
                  (item.producto || '').toLowerCase().includes(filtro.toLowerCase())
              )
              .sort((a, b) => {
                if (ordenCampo === 'producto') {
                  const pa = (a.producto || '').toString();
                  const pb = (b.producto || '').toString();
                  return ordenAscendente ? pa.localeCompare(pb) : pb.localeCompare(pa);
                } else if (ordenCampo === 'stock_actual') {
                  return ordenAscendente
                    ? (a.stock_actual || 0) - (b.stock_actual || 0)
                    : (b.stock_actual || 0) - (a.stock_actual || 0);
                }
                return 0;
              })
              .map(({ codigo, producto, stock_actual }) => {
                const actual = parseInt(stock_actual, 10) || 0;
                const real = ajustes[codigo] ?? '';
                const diferencia = real !== '' ? (parseInt(real, 10) || 0) - actual : '';
                const color =
                  diferencia > 0 ? 'text-success' : diferencia < 0 ? 'text-danger' : '';

                const nombreEnEdicion = nombresEditados[codigo] ?? producto ?? '';

                return (
                  <tr key={codigo}>
                    <td className="text-nowrap">{codigo}</td>

                    {/* Producto editable + botón guardar */}
                    <td>
                      <div className="d-flex gap-2 align-items-center">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={nombreEnEdicion}
                          onChange={(e) => handleNombreChange(codigo, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') guardarNombre(codigo, producto);
                          }}
                          style={{ minWidth: "250px" }} // 👈 más espacio
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          title="Guardar nombre"
                          onClick={() => guardarNombre(codigo, producto)}
                        >
                          Guardar
                        </button>
                      </div>
                    </td>

                    <td>{actual}</td>

                    <td style={{ minWidth: 110 }}>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={real}
                        onChange={(e) => handleChange(codigo, e.target.value)}
                      />
                    </td>

                    <td className={color}>{diferencia}</td>

                    <td className="text-nowrap" title={fechasAjuste[codigo]?.fecha || ''}>
                      {fechasAjuste[codigo]?.comentario || '-'}
                    </td>

                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={real === '' || diferencia === 0}
                        onClick={() => ajustarStock(codigo, nombreEnEdicion || producto, actual)}
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
    </div>
  );
};

export default AjusteStock;
