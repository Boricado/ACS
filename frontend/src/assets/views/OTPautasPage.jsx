import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OTPautasPage = () => {
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);
  const [categoria, setCategoria] = useState('Perfiles');
  const [material, setMaterial] = useState({ codigo: '', producto: '', cantidad: '' });
  const [materiales, setMateriales] = useState([]);
  const [items, setItems] = useState([]);
  const [pautasCargadas, setPautasCargadas] = useState([]);
  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${API}api/clientes`)
      .then(res => setClientes(res.data))
      .catch(err => console.error('Error al cargar clientes:', err));

    axios.get(`${API}api/materiales`)
      .then(res => setMateriales(res.data))
      .catch(err => console.error('Error al cargar materiales:', err));
  }, []);

  useEffect(() => {
    if (clienteSeleccionado?.id) {
      axios.get(`${API}api/presupuestos/cliente/${clienteSeleccionado.id}`)
        .then(res => setPresupuestos(res.data))
        .catch(err => console.error('Error al cargar presupuestos:', err));
    }
  }, [clienteSeleccionado]);

  const handleCodigoChange = (codigo) => {
    const m = materiales.find(m => m.codigo === codigo);
    setMaterial({ ...material, codigo, producto: m ? m.producto : '' });
  };

  const handleProductoChange = (producto) => {
    const m = materiales.find(m => m.producto === producto);
    setMaterial({ ...material, producto, codigo: m ? m.codigo : '' });
  };

  const agregarItem = () => {
    if (!material.codigo || !material.producto || !material.cantidad) return;
    setItems([...items, { ...material }]);
    setMaterial({ codigo: '', producto: '', cantidad: '' });
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    const nuevosItems = [...items];
    nuevosItems[index].cantidad = nuevaCantidad;
    setItems(nuevosItems);
  };

  const eliminarItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const eliminarPautaCargada = async (id) => {
    try {
      await axios.delete(`${API}api/ot_pautas/${categoria.toLowerCase()}/${id}`);
      cargarPautas();
    } catch (err) {
      console.error('Error al eliminar pauta:', err);
    }
  };

  const validarClienteYPresupuesto = async (clienteId, presupuestoId) => {
    try {
      const clienteRes = await axios.get(`${API}api/clientes/${clienteId}`);
      const presupuestoRes = await axios.get(`${API}api/presupuestos/id/${presupuestoId}`);
      return clienteRes.status === 200 && presupuestoRes.status === 200;
    } catch (err) {
      return false;
    }
  };

  const guardarPauta = async () => {
    if (!clienteSeleccionado?.id || !presupuestoSeleccionado?.id || !categoria) {
      alert('Seleccione cliente, presupuesto y categoría válidos.');
      return;
    }

    const esValido = await validarClienteYPresupuesto(clienteSeleccionado.id, presupuestoSeleccionado.id);
    if (!esValido) {
      alert('Cliente o presupuesto no válido en la base de datos.');
      return;
    }

    try {
      for (const i of items) {
        await axios.post(`${API}api/ot_pautas/${categoria.toLowerCase()}`, {
          cliente_id: clienteSeleccionado.id,
          presupuesto_id: presupuestoSeleccionado.id,
          numero_presupuesto: presupuestoSeleccionado.numero, // 👈 este campo es clave
          codigo: i.codigo,
          producto: i.producto,
          cantidad: parseInt(i.cantidad)
        });
      }
      alert('Pauta guardada con éxito.');
      setItems([]);
      cargarPautas();
    } catch (err) {
      console.error('Error al guardar pauta:', err);
      alert('Error al guardar pauta');
    }
  };

  const cargarPautas = async () => {
    if (!clienteSeleccionado?.id || !presupuestoSeleccionado?.id || !categoria) return;
    try {
      const res = await axios.get(`${API}api/ot_pautas/${categoria.toLowerCase()}?cliente_id=${clienteSeleccionado.id}&presupuesto_id=${presupuestoSeleccionado.id}`);
      setPautasCargadas(res.data);
    } catch (err) {
      console.error('Error al cargar pautas:', err);
    }
  };

  const actualizarPauta = async (id, nuevaCantidad) => {
    try {
      await axios.put(`${API}api/ot_pautas/${categoria.toLowerCase()}/${id}`, {
        cantidad: parseInt(nuevaCantidad)
      });
      cargarPautas();
    } catch (err) {
      console.error('Error al actualizar pauta:', err);
    }
  };

  return (
    <div className="container mt-4">
      <h3>Pautas de Oficina Técnica</h3>

      <div className="row mb-3">
        <div className="col-md-4">
          <label>Cliente</label>
          <select className="form-select" value={clienteSeleccionado?.id || ''} onChange={(e) => {
            const cliente = clientes.find(c => c.id === parseInt(e.target.value));
            setClienteSeleccionado(cliente || null);
          }}>
            <option value="">Seleccionar cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label>Presupuesto</label>
          <select className="form-select" value={presupuestoSeleccionado?.id || ''} onChange={(e) => {
            const presupuesto = presupuestos.find(p => p.id === parseInt(e.target.value));
            setPresupuestoSeleccionado(presupuesto || null);
          }}>
            <option value="">Seleccionar presupuesto</option>
            {presupuestos.map(p => (
              <option key={p.id} value={p.id}>{p.numero}</option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label>Categoría</label>
          <select className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {['Perfiles', 'Refuerzos', 'Herraje', 'Accesorios', 'GomasCepillos', 'Tornillos', 'Vidrio', 'Instalacion'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <label>Código</label>
          <input list="codigos" className="form-control" value={material.codigo} onChange={(e) => handleCodigoChange(e.target.value)} />
          <datalist id="codigos">
            {materiales.map(m => <option key={m.codigo} value={m.codigo} />)}
          </datalist>
        </div>
        <div className="col-md-5">
          <label>Producto</label>
          <input list="productos" className="form-control" value={material.producto} onChange={(e) => handleProductoChange(e.target.value)} />
          <datalist id="productos">
            {materiales.map(m => <option key={m.producto} value={m.producto} />)}
          </datalist>
        </div>
        <div className="col-md-2">
          <label>Cantidad</label>
          <input type="number" className="form-control" value={material.cantidad} onChange={(e) => setMaterial({ ...material, cantidad: e.target.value })} />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={agregarItem}>Añadir</button>
        </div>
      </div>

      {items.length > 0 && (
        <table className="table table-bordered table-hover mt-3">
          <thead className="table-light">
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx}>
                <td>{i.codigo}</td>
                <td>{i.producto}</td>
                <td>
                  <input type="number" className="form-control form-control-sm" value={i.cantidad} onChange={(e) => actualizarCantidad(idx, e.target.value)} />
                </td>
                <td><button className="btn btn-sm btn-danger" onClick={() => eliminarItem(idx)}>X</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="btn btn-success mt-3 me-2" onClick={guardarPauta}>Guardar Pauta</button>
      <button className="btn btn-secondary mt-3" onClick={cargarPautas}>Ver Pautas Cargadas</button>

       {pautasCargadas.length > 0 && (
        <div className="mt-4">
          <h5>Pautas Cargadas</h5>
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {pautasCargadas.map((p, idx) => (
                <tr key={idx}>
                  <td>{p.id}</td>
                  <td>{p.codigo}</td>
                  <td>{p.producto}</td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={p.cantidad}
                      onChange={(e) => actualizarPauta(p.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => eliminarPautaCargada(p.id)}>X</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OTPautasPage;
