import React, { useEffect, useState } from 'react';
import axios from 'axios';

const categorias = [
  { key: 'perfiles', label: 'PERFILES' },
  { key: 'refuerzos', label: 'REFUERZOS' },
  { key: 'tornillos', label: 'TORNILLOS' },
  { key: 'herraje', label: 'HERRAJE' },
  { key: 'accesorios', label: 'ACCESORIOS' },
  { key: 'gomascepillos', label: 'GOMAS Y CEPILLOS' },
  { key: 'vidrio', label: 'VIDRIO' },
  { key: 'instalacion', label: 'INSTALACION' },
];

const OTPautasPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const [clienteId, setClienteId] = useState('');
  const [presupuestoId, setPresupuestoId] = useState('');
  const [numeroPresupuesto, setNumeroPresupuesto] = useState('');
  const [data, setData] = useState({});
  const [inputs, setInputs] = useState({ codigo: '', producto: '', cantidad_cargada: '', cantidad: '', categoria: '' });

  const cargarPautas = async () => {
    const newData = {};
    for (let cat of categorias) {
      const res = await axios.get(`${API}api/ot_pautas/${cat.key}`);
      newData[cat.key] = res.data.filter(p => p.presupuesto_id === parseInt(presupuestoId));
    }
    setData(newData);
  };

  useEffect(() => {
    if (clienteId && presupuestoId) cargarPautas();
  }, [clienteId, presupuestoId]);

  const agregarManual = () => {
    const nuevaFila = {
      codigo: inputs.codigo,
      producto: inputs.producto,
      cantidad_original: parseFloat(inputs.cantidad_cargada || 0),
      cantidad: parseFloat(inputs.cantidad || 0),
    };
    if (!inputs.categoria) return;
    setData(prev => ({
      ...prev,
      [inputs.categoria]: [...(prev[inputs.categoria] || []), nuevaFila],
    }));
    setInputs({ codigo: '', producto: '', cantidad_cargada: '', cantidad: '', categoria: '' });
  };

  const eliminarItem = (catKey, index) => {
    setData(prev => ({
      ...prev,
      [catKey]: prev[catKey].filter((_, i) => i !== index),
    }));
  };

  const actualizarCantidad = (catKey, index, valor) => {
    setData(prev => {
      const actual = [...prev[catKey]];
      actual[index].cantidad = parseFloat(valor);
      return { ...prev, [catKey]: actual };
    });
  };

  const guardarTodo = async () => {
    for (let cat of categorias) {
      const items = (data[cat.key] || []).filter(i => i.codigo && i.producto);
      if (items.length > 0) {
        await axios.post(`${API}api/ot_pautas/${cat.key}/lote`, {
          cliente_id: clienteId,
          presupuesto_id: presupuestoId,
          numero_presupuesto: numeroPresupuesto,
          items,
        });
      }
    }
    alert('Guardado completo.');
  };

  return (
    <div className="container">
      <h4>Carga de Pautas</h4>
      <div className="row mb-3">
        <div className="col">
          <input className="form-control" placeholder="Cliente ID" value={clienteId} onChange={e => setClienteId(e.target.value)} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="Presupuesto ID" value={presupuestoId} onChange={e => setPresupuestoId(e.target.value)} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="Número de Presupuesto" value={numeroPresupuesto} onChange={e => setNumeroPresupuesto(e.target.value)} />
        </div>
        <div className="col">
          <button className="btn btn-primary w-100" onClick={guardarTodo}>Guardar TODO</button>
        </div>
      </div>

      <div className="card p-3 mb-4">
        <h5>Ingreso Manual</h5>
        <div className="row">
          <div className="col">
            <input className="form-control" placeholder="Código" value={inputs.codigo} onChange={e => setInputs({ ...inputs, codigo: e.target.value })} />
          </div>
          <div className="col">
            <input className="form-control" placeholder="Producto" value={inputs.producto} onChange={e => setInputs({ ...inputs, producto: e.target.value })} />
          </div>
          <div className="col">
            <input className="form-control" placeholder="Cantidad Cargada" value={inputs.cantidad_cargada} onChange={e => setInputs({ ...inputs, cantidad_cargada: e.target.value })} />
          </div>
          <div className="col">
            <input className="form-control" placeholder="Cantidad Solicitada" value={inputs.cantidad} onChange={e => setInputs({ ...inputs, cantidad: e.target.value })} />
          </div>
          <div className="col">
            <select className="form-select" value={inputs.categoria} onChange={e => setInputs({ ...inputs, categoria: e.target.value })}>
              <option value="">Categoría</option>
              {categorias.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="col">
            <button className="btn btn-success w-100" onClick={agregarManual}>Agregar</button>
          </div>
        </div>
      </div>

      {categorias.map(cat => (
        <div key={cat.key} className="mb-4">
          <h5>{cat.label}</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad Cargada</th>
                <th>Cantidad Solicitada</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {(data[cat.key] || []).map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{item.codigo}</td>
                  <td>{item.producto}</td>
                  <td>{item.cantidad_original}</td>
                  <td>
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={e => actualizarCantidad(cat.key, i, e.target.value)}
                      className="form-control"
                    />
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => eliminarItem(cat.key, i)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default OTPautasPage;