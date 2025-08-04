import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CargaCSV from '../components/CargaCSV';

const OTPautasPage = () => {
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);
  const [categoria, setCategoria] = useState('Perfiles');
  const [material, setMaterial] = useState({ codigo: '', producto: '', cantidad: '' });
  const [materiales, setMateriales] = useState([]);
  const [dataPorCategoria, setDataPorCategoria] = useState({});
  const [mensajeActualizacion, setMensajeActualizacion] = useState('');
  const [pautasCargadas, setPautasCargadas] = useState([]);

  const API = import.meta.env.VITE_API_URL;

  const categoriasDisponibles = [
  'perfiles',
  'refuerzos',
  'herraje',
  'accesorios',
  'gomascepillos',
  'tornillos',
  'vidrio',
  'instalacion'
];


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

    const nuevoItem = {
      codigo: material.codigo,
      producto: material.producto,
      cantidad: parseInt(material.cantidad),
      cantidad_original: parseFloat(material.cantidad)
    };

    setDataPorCategoria(prev => {
      const copia = { ...prev };
      const catKey = categoria.toLowerCase();
      if (!copia[catKey]) copia[catKey] = [];
      copia[catKey].push(nuevoItem);
      return copia;
    });

    setMaterial({ codigo: '', producto: '', cantidad: '' });
  };

  const actualizarCantidadManual = (categoria, idx, valor) => {
    const nuevo = { ...dataPorCategoria };
    nuevo[categoria][idx].cantidad = parseInt(valor) || 0;
    setDataPorCategoria(nuevo);
  };

  const eliminarItemManual = (categoria, idx) => {
    const nuevo = { ...dataPorCategoria };
    nuevo[categoria].splice(idx, 1);
    setDataPorCategoria(nuevo);
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
    if (!clienteSeleccionado?.id || !presupuestoSeleccionado?.id || Object.keys(dataPorCategoria).length === 0) {
      alert('Seleccione cliente, presupuesto y agregue ítems.');
      return;
    }

    const esValido = await validarClienteYPresupuesto(clienteSeleccionado.id, presupuestoSeleccionado.id);
    if (!esValido) {
      alert('Cliente o presupuesto no válido en la base de datos.');
      return;
    }

    try {
      for (const cat in dataPorCategoria) {
        const payload = {
          cliente_id: clienteSeleccionado.id,
          presupuesto_id: presupuestoSeleccionado.id,
          numero_presupuesto: presupuestoSeleccionado.numero,
          items: dataPorCategoria[cat],
        };
        await axios.post(`${API}api/ot_pautas/${cat}/lote`, payload);
      }

      alert('Pauta guardada con éxito.');
      setDataPorCategoria({});
      cargarPautas();
    } catch (err) {
      console.error('Error al guardar pauta:', err);
      alert('Error al guardar pauta');
    }
  };

  const cargarPautas = async () => {
    if (!clienteSeleccionado?.id || !presupuestoSeleccionado?.id) return;

    try {
      let todas = [];

      for (const cat of categoriasDisponibles) {
        const res = await axios.get(`${API}api/ot_pautas/${cat}?cliente_id=${clienteSeleccionado.id}&presupuesto_id=${presupuestoSeleccionado.id}`);
        const pautasConCategoria = res.data.map(p => ({ ...p, _categoria: cat }));
        todas = [...todas, ...pautasConCategoria];
      }

      setPautasCargadas(todas);
    } catch (err) {
      console.error('Error al cargar todas las pautas:', err);
    }
  };


  const actualizarPauta = async (id, nuevaCantidad) => {
    try {
      await axios.put(`${API}api/ot_pautas/${categoria.toLowerCase()}/${id}`, {
        cantidad: parseInt(nuevaCantidad)
      });
      setMensajeActualizacion('Cantidad actualizada con éxito.');
      cargarPautas();
      setTimeout(() => setMensajeActualizacion(''), 3000);
    } catch (err) {
      console.error('Error al actualizar pauta:', err);
      setMensajeActualizacion('❌ Error al actualizar cantidad.');
      setTimeout(() => setMensajeActualizacion(''), 3000);
    }
  };

  const eliminarPautaCargada = async (id) => {
    try {
      await axios.delete(`${API}api/ot_pautas/${categoria.toLowerCase()}/${id}`);
      cargarPautas();
    } catch (err) {
      console.error('Error al eliminar pauta:', err);
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

      <CargaCSV setDataPorCategoria={setDataPorCategoria} />

      {Object.keys(dataPorCategoria).length > 0 && (
        <div className="mt-4">
          <h5>Materiales por Categoría</h5>
          {Object.entries(dataPorCategoria).map(([cat, lista]) => (
            <div key={cat} className="mb-4">
              <h6 className="text-uppercase">{cat}</h6>
              <table className="table table-bordered table-sm">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{item.codigo}</td>
                      <td>{item.producto}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={item.cantidad}
                          onChange={(e) => actualizarCantidadManual(cat, idx, e.target.value)}
                        />
                      </td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => eliminarItemManual(cat, idx)}>X</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-success mt-3 me-2" onClick={guardarPauta}>Guardar TODO</button>
      <button className="btn btn-secondary mt-3" onClick={cargarPautas}>Ver Pautas Cargadas</button>

    {pautasCargadas.length > 0 && (
      <div className="mt-4">
        <h5>Pautas Cargadas por Categoría</h5>
        {categoriasDisponibles.map((cat) => {
          const itemsCat = pautasCargadas.filter(p => p._categoria === cat);
          if (itemsCat.length === 0) return null;

          return (
            <div key={cat} className="mb-4">
              <h6 className="text-uppercase">{cat}</h6>
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsCat.map((p, idx) => (
                    <tr key={p.id}>
                      <td>{idx + 1}</td>
                      <td>{p.codigo}</td>
                      <td>{p.producto}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={p.cantidad}
                          onChange={(e) => {
                            const nuevaCantidad = e.target.value;
                            setPautasCargadas(prev => {
                              return prev.map(item =>
                                item.id === p.id ? { ...item, cantidad: nuevaCantidad } : item
                              );
                            });
                          }}
                        />
                      </td>
                      <td className="d-flex gap-1">
                        <button className="btn btn-sm btn-success" onClick={() => actualizarPauta(p.id, p.cantidad)}>✓</button>
                        <button className="btn btn-sm btn-danger" onClick={() => eliminarPautaCargada(p.id)}>X</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        {mensajeActualizacion && (
          <div className="alert alert-success py-2">{mensajeActualizacion}</div>
        )}
      </div>
    )}

    </div>
  );
};

export default OTPautasPage;
