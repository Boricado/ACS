// src/views/InventarioPage.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const InventarioPage = () => {
  const [inventario, setInventario] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [mostrarStockCero, setMostrarStockCero] = useState(false);
  const [detalleVisible, setDetalleVisible] = useState(null);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${API}api/inventario`)
      .then(res => setInventario(res.data))
      .catch(err => console.error("❌ Error al cargar inventario:", err));
  }, []);

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const tablas = [
          'ot_pautas_perfiles', 'ot_pautas_refuerzos', 'ot_pautas_tornillos',
          'ot_pautas_herraje', 'ot_pautas_accesorios', 'ot_pautas_gomascepillos',
          'ot_pautas_vidrio', 'ot_pautas_instalacion'
        ];

        let reservasTemp = [];
        for (const tabla of tablas) {
          const res = await axios.get(`${API}api/${tabla}`);
          reservasTemp = reservasTemp.concat(
            res.data.map(r => ({
              codigo: r.codigo,
              producto: r.producto,
              cantidad: parseInt(r.cantidad),
              presupuesto: r.numero_presupuesto,
              cliente_id: r.cliente_id,
              nombre_obra: r.nombre_obra
            }))
          );
        }

        setReservas(reservasTemp);
      } catch (err) {
        console.error("❌ Error al cargar reservas:", err);
      }
    };

    const fetchClientes = async () => {
      try {
        const res = await axios.get(`${API}api/clientes`);
        setClientes(res.data);
      } catch (err) {
        console.error("❌ Error al cargar clientes:", err);
      }
    };

    const fetchSalidas = async () => {
      try {
        const res = await axios.get(`${API}api/salidas_inventario2`);
        setSalidas(res.data);
      } catch (err) {
        console.error("❌ Error al cargar salidas:", err);
      }
    };

    fetchReservas();
    fetchClientes();
    fetchSalidas();
  }, []);

  const getReservado = (codigo) =>
    reservas
      .filter(r => r.codigo === codigo)
      .reduce((sum, r) => sum + r.cantidad, 0);

  const getSalidas = (codigo) =>
    salidas
      .filter(s => s.codigo === codigo)
      .reduce((sum, s) => sum + parseInt(s.cantidad), 0);

  const getClienteNombre = (id) => {
    const cliente = clientes.find(c => c.id === id);
    return cliente ? cliente.nombre : `ID ${id}`;
  };

  const toggleDetalles = (codigo) => {
    setDetalleVisible(detalleVisible === codigo ? null : codigo);
  };

  const inventarioFiltrado = inventario
    .filter(item =>
      (item.codigo || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (item.producto || '').toLowerCase().includes(filtro.toLowerCase())
    )
    .filter(item => mostrarStockCero || parseInt(item.stock_actual) > 0)
    .sort((a, b) => {
      const aReservado = getReservado(a.codigo);
      const bReservado = getReservado(b.codigo);
      return bReservado - aReservado;
    });

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
            <th style={{ borderRight: 'double' }}>Último Precio</th>
            <th style={{ borderLeft: 'double' }}>Stock Mínimo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {inventarioFiltrado.length > 0 ? (
            inventarioFiltrado.map((item, index) => {
              const reservado = getReservado(item.codigo);
              const salidasRealizadas = getSalidas(item.codigo);
              const stockReal = parseInt(item.stock_actual) - salidasRealizadas;
              const stockDisponible = stockReal - reservado;
              const rowClass = reservado > 0 ? 'table-warning' : '';

              return (
                <React.Fragment key={index}>
                  <tr className={rowClass} onClick={() => toggleDetalles(item.codigo)}>
                    <td>{item.codigo}</td>
                    <td>{item.producto || '-'}</td>
                    <td>{stockReal}</td>
                    <td>{reservado}</td>
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
                        <ul className="mb-0">
                          {reservas
                            .filter(r => r.codigo === item.codigo)
                            .map((r, i) => (
                              <li key={i}>
                                Cliente: {getClienteNombre(r.cliente_id)} - Presupuesto: {r.presupuesto} - Obra: {r.nombre_obra} - Cantidad: {r.cantidad}
                              </li>
                            ))}
                        </ul>
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
