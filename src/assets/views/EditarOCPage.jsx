import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EditarOCPage = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [numeroOCSeleccionado, setNumeroOCSeleccionado] = useState('');
  const [items, setItems] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:4000/api/ordenes_compra')
      .then(res => setOrdenes(res.data))
      .catch(() => setOrdenes([]));
  }, []);

  useEffect(() => {
    if (numeroOCSeleccionado) {
      axios.get(`http://localhost:4000/api/items_oc/${numeroOCSeleccionado}`)
        .then(res => setItems(res.data))
        .catch(() => setItems([]));
    }
  }, [numeroOCSeleccionado]);

  const handleChangeItem = (index, field, value) => {
    const actualizados = [...items];
    actualizados[index][field] = value === null ? '' : value;
    setItems(actualizados);
  };

  const eliminarItem = async (index) => {
    const item = items[index];
    if (item.id) {
      try {
        await axios.delete(`http://localhost:4000/api/items_oc/${item.id}`);
      } catch (err) {
        console.error('Error al eliminar ítem:', err.message);
      }
    }
    const actualizados = [...items];
    actualizados.splice(index, 1);
    setItems(actualizados);
  };

  const agregarItem = () => {
    setItems([...items, {
      codigo: '',
      producto: '',
      cantidad: '',
      precio_unitario: ''
    }]);
  };

  const guardarCambios = async () => {
    try {
      for (const it of items) {
        if (it.id) {
          await axios.put(`http://localhost:4000/api/items_oc/${it.id}`, it);
        } else {
          await axios.post('http://localhost:4000/api/items_oc', {
            ...it,
            numero_oc: numeroOCSeleccionado
          });
        }
      }
      const res = await axios.get(`http://localhost:4000/api/items_oc/${numeroOCSeleccionado}`);
      setItems(res.data);
      setMensaje({ tipo: 'success', texto: 'Ítems actualizados correctamente' });
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar los cambios' });
    }
  };

  return (
    <div className="container mt-4">
      <h3>Editar Ítems de Orden de Compra</h3>
      {mensaje && (
        <div className={`alert alert-${mensaje.tipo === 'error' ? 'danger' : 'success'}`}>{mensaje.texto}</div>
      )}

      <div className="mb-3">
        <select className="form-select" value={numeroOCSeleccionado} onChange={e => setNumeroOCSeleccionado(e.target.value)}>
          <option value="">Seleccione N° OC</option>
            {ordenes.map((o, idx) => (
            <option key={`${o.numero_oc}-${idx}`} value={o.numero_oc}>
                {o.numero_oc} - {o.proveedor} ({o.cliente_id ?? 'Sin cliente'}, Ppto #{o.numero_presupuesto ?? 'N/A'})
            </option>
            ))}

        </select>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td><input value={it.codigo ?? ''} onChange={e => handleChangeItem(i, 'codigo', e.target.value)} className="form-control form-control-sm" /></td>
                <td><input value={it.producto ?? ''} onChange={e => handleChangeItem(i, 'producto', e.target.value)} className="form-control form-control-sm" /></td>
                <td><input type="number" value={it.cantidad ?? ''} onChange={e => handleChangeItem(i, 'cantidad', parseFloat(e.target.value) || '')} className="form-control form-control-sm" /></td>
                <td><input type="number" value={it.precio_unitario ?? ''} onChange={e => handleChangeItem(i, 'precio_unitario', parseFloat(e.target.value) || '')} className="form-control form-control-sm" /></td>
                <td><button className="btn btn-outline-danger btn-sm" onClick={() => eliminarItem(i)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between mt-3">
        <button onClick={agregarItem} className="btn btn-outline-primary">Agregar Elemento</button>
        <button onClick={guardarCambios} className="btn btn-outline-success px-4">Guardar Cambios</button>
      </div>
    </div>
  );
};

export default EditarOCPage;
