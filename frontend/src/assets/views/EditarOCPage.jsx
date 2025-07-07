import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EditarOCPage = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [numeroOCSeleccionado, setNumeroOCSeleccionado] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Pendiente');
  const [items, setItems] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [comentario, setComentario] = useState('');
  const [totales, setTotales] = useState({ neto: 0, iva: 0, total: 0 });

  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const res = await axios.get(
          estadoFiltro === 'Todas'
            ? 'http://localhost:4000/api/ordenes_compra'
            : `http://localhost:4000/api/ordenes_compra_estado?estado=${estadoFiltro}`
        );
        setOrdenes(res.data);
      } catch {
        setOrdenes([]);
      }
    };

    fetchOrdenes();

    axios.get('http://localhost:4000/api/materiales')
      .then(res => setMateriales(res.data))
      .catch(() => setMateriales([]));
  }, [estadoFiltro]);

  useEffect(() => {
    if (numeroOCSeleccionado) {
      axios.get(`http://localhost:4000/api/items_oc/${numeroOCSeleccionado}`)
        .then(res => {
          setItems(res.data);
          calcularTotales(res.data);
        })
        .catch(() => setItems([]));
    }
  }, [numeroOCSeleccionado]);

  const obtenerPrecioUltimo = async (codigo) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/precio-material?codigo=${codigo}`);
      return res.data.precio_unitario;
    } catch (error) {
      console.error('Error al obtener precio desde backend:', error);
      return '';
    }
  };

  const handleChangeItem = async (index, field, value) => {
    const actualizados = [...items];
    actualizados[index][field] = value === null ? '' : value;

    if (field === 'codigo') {
      const m = materiales.find(m => m.codigo === value);
      const precio = m?.precio_unitario || await obtenerPrecioUltimo(value);
      actualizados[index].producto = m ? m.producto : '';
      actualizados[index].precio_unitario = precio;
    }

    if (field === 'producto') {
      const m = materiales.find(m => m.producto === value);
      const precio = m?.precio_unitario || (m?.codigo ? await obtenerPrecioUltimo(m.codigo) : '');
      actualizados[index].codigo = m ? m.codigo : '';
      actualizados[index].precio_unitario = precio;
    }

    setItems(actualizados);
    calcularTotales(actualizados);
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
    calcularTotales(actualizados);
  };

  const agregarItem = () => {
    const nuevosItems = [...items, {
      codigo: '',
      producto: '',
      cantidad: '',
      precio_unitario: ''
    }];
    setItems(nuevosItems);
    calcularTotales(nuevosItems);
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
      if (comentario) {
        await axios.put(`http://localhost:4000/api/ordenes_compra/${numeroOCSeleccionado}`, { comentario });
      }
      const res = await axios.get(`http://localhost:4000/api/items_oc/${numeroOCSeleccionado}`);
      setItems(res.data);
      calcularTotales(res.data);
      setMensaje({ tipo: 'success', texto: 'Ítems actualizados correctamente' });
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar los cambios' });
    }
  };

  const calcularTotales = (items) => {
    const neto = items.reduce((sum, it) => sum + ((it.precio_unitario || 0) * (it.cantidad || 0)), 0);
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;
    setTotales({ neto, iva, total });
  };

  return (
    <div className="container mt-4">
      <h3>Editar Ítems de Orden de Compra</h3>
      {mensaje && (
        <div className={`alert alert-${mensaje.tipo === 'error' ? 'danger' : 'success'}`}>{mensaje.texto}</div>
      )}

      <div className="mb-3 d-flex gap-3">
        <select className="form-select w-25" value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}>
          <option>Pendiente</option>
          <option>Completas</option>
          <option>Todas</option>
        </select>

        <select className="form-select w-50" value={numeroOCSeleccionado} onChange={e => setNumeroOCSeleccionado(e.target.value)}>
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
                <td>
                  <input list="codigos" value={it.codigo ?? ''} onChange={e => handleChangeItem(i, 'codigo', e.target.value)} className="form-control form-control-sm" />
                </td>
                <td>
                  <input list="productos" value={it.producto ?? ''} onChange={e => handleChangeItem(i, 'producto', e.target.value)} className="form-control form-control-sm" />
                </td>
                <td>
                  <input type="number" value={it.cantidad ?? ''} onChange={e => handleChangeItem(i, 'cantidad', parseFloat(e.target.value) || '')} className="form-control form-control-sm" />
                </td>
                <td>
                  <input type="number" value={it.precio_unitario ?? ''} onChange={e => handleChangeItem(i, 'precio_unitario', parseFloat(e.target.value) || '')} className="form-control form-control-sm" />
                </td>
                <td>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarItem(i)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <datalist id="codigos">
          {materiales.map((m, idx) => (
            <option key={`cod-${idx}`} value={m.codigo} />
          ))}
        </datalist>

        <datalist id="productos">
          {materiales.map((m, idx) => (
            <option key={`prod-${idx}`} value={m.producto} />
          ))}
        </datalist>
      </div>

      <div className="text-end me-3">
        <p><strong>Total Neto:</strong> ${totales.neto.toLocaleString()}</p>
        <p><strong>IVA 19%:</strong> ${totales.iva.toLocaleString()}</p>
        <p><strong>TOTAL:</strong> ${totales.total.toLocaleString()}</p>
      </div>

      <label>Comentario</label>
      <textarea className="form-control mb-3" rows="2" value={comentario} onChange={(e) => setComentario(e.target.value)} />

      <div className="d-flex justify-content-between">
        <button onClick={agregarItem} className="btn btn-outline-primary">Agregar Elemento</button>
        <button onClick={guardarCambios} className="btn btn-outline-success px-4">Guardar Cambios</button>
      </div>
    </div>
  );
};

export default EditarOCPage;
