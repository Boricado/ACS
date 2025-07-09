import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EditarItemsPresupuestoPage = () => {
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState('');
  const [items, setItems] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const API = import.meta.env.VITE_API_URL;


  useEffect(() => {
    axios.get(`${API}api/clientes`)
      .then(res => setClientes(res.data))
      .catch(() => setClientes([]));
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      axios.get(`${API}api/presupuestos/cliente/${clienteSeleccionado}`)
        .then(res => setPresupuestos(res.data))
        .catch(() => setPresupuestos([]));
    } else {
      setPresupuestos([]);
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    if (presupuestoSeleccionado) {
      axios.get(`${API}api/items_presupuesto/presupuesto/${presupuestoSeleccionado}`)
        .then(res => setItems(res.data))
        .catch(() => setItems([]));
    }
  }, [presupuestoSeleccionado]);

  const handleChangeItem = (index, field, value) => {
    const actualizados = [...items];
    actualizados[index][field] = value === null ? '' : value;
    setItems(actualizados);
  };

  const eliminarItem = async (index) => {
    const item = items[index];
    if (item.id) {
      try {
        await axios.delete(`${API}api/items_presupuesto/${item.id}`)
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
      item: '',
      recinto: '',
      ancho: '',
      alto: '',
      tipo_ventana: 'Doble Corredera',
      tipo_apertura: 'Derecha',
      grada_buque: false,
      observaciones: false,
      texto_observaciones: '',
      adicional: false,
      cuadros_adicionales: '',
      cantidad: '',
      precio_unitario: ''
    }]);
  };

  const guardarCambios = async () => {
    try {
      for (const it of items) {
        if (it.id) {
          await axios.put(`${API}api/items_presupuesto/${it.id}`, it);
        } else if (presupuestoSeleccionado) {
          await axios.post(`${API}api/items_presupuesto`, {
            ...it,
            presupuesto_id: presupuestoSeleccionado
          });
        }
      }
      const res = await axios.get(`${API}api/items_presupuesto/presupuesto/${presupuestoSeleccionado}`);
      setItems(res.data);
      setMensaje({ tipo: 'success', texto: 'Ítems guardados y actualizados correctamente' });
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar los cambios' });
    }
  };

  const opcionesTipoVentana = [
    'Doble Corredera', 'Proyectante', 'Fijo', 'Oscilobatiente', 'Doble corredera con fijo', 'Marco puerta', 'Otro'
  ];
  const opcionesTipoApertura = ['Derecha', 'Izquierda', 'Por Definir'];

  return (
    <div className="container mt-4">
      <h3>Editar Ítems del Presupuesto</h3>
      {mensaje && (
        <div className={`alert alert-${mensaje.tipo === 'error' ? 'danger' : 'success'}`}>{mensaje.texto}</div>
      )}

      <div className="row mb-3">
        <div className="col-md-6">
          <select className="form-select" value={clienteSeleccionado} onChange={e => setClienteSeleccionado(e.target.value)}>
            <option value="">Seleccione Cliente</option>
            {clientes.map(cli => (
              <option key={cli.id} value={cli.id}>{cli.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <select className="form-select" value={presupuestoSeleccionado} onChange={e => setPresupuestoSeleccionado(e.target.value)}>
            <option value="">Seleccione Presupuesto</option>
            {presupuestos.map(p => (
              <option key={p.id} value={p.id}>#{p.numero} - {p.nombre_obra}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th style={{ minWidth: '80px' }}>Ítem</th>
              <th style={{ minWidth: '100px' }}>Recinto</th>
              <th style={{ minWidth: '70px' }}>Ancho</th>
              <th style={{ minWidth: '70px' }}>Alto</th>
              <th style={{ minWidth: '140px' }}>Tipo Ventana</th>
              <th style={{ minWidth: '100px' }}>Apertura</th>
              <th>Grada</th>
              <th>Obs</th>
              <th style={{ minWidth: '180px' }}>Texto Obs</th>
              <th>Adic</th>
              <th style={{ minWidth: '70px' }}>Cuadros</th>
              <th style={{ minWidth: '70px' }}>Cant</th>
              <th style={{ minWidth: '80px' }}>Precio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} style={{ verticalAlign: 'middle' }}>
                <td><input value={it.item ?? ''} onChange={e => handleChangeItem(i, 'item', e.target.value)} className="form-control form-control-sm" style={{ minWidth: '80px' }} /></td>
                <td><input value={it.recinto ?? ''} onChange={e => handleChangeItem(i, 'recinto', e.target.value)} className="form-control form-control-sm" style={{ minWidth: '100px' }} /></td>
                <td><input type="number" value={it.ancho ?? ''} onChange={e => handleChangeItem(i, 'ancho', parseFloat(e.target.value) || '')} className="form-control form-control-sm" style={{ minWidth: '70px' }} /></td>
                <td><input type="number" value={it.alto ?? ''} onChange={e => handleChangeItem(i, 'alto', parseFloat(e.target.value) || '')} className="form-control form-control-sm" style={{ minWidth: '70px' }} /></td>
                <td>
                  <select value={it.tipo_ventana ?? ''} onChange={e => handleChangeItem(i, 'tipo_ventana', e.target.value)} className="form-select form-select-sm" style={{ minWidth: '140px' }}>
                    {opcionesTipoVentana.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </td>
                <td>
                  <select value={it.tipo_apertura ?? ''} onChange={e => handleChangeItem(i, 'tipo_apertura', e.target.value)} className="form-select form-select-sm" style={{ minWidth: '100px' }}>
                    {opcionesTipoApertura.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </td>
                <td><input type="checkbox" checked={it.grada_buque ?? false} onChange={e => handleChangeItem(i, 'grada_buque', e.target.checked)} /></td>
                <td><input type="checkbox" checked={it.observaciones ?? false} onChange={e => handleChangeItem(i, 'observaciones', e.target.checked)} /></td>
                <td><input value={it.texto_observaciones ?? ''} onChange={e => handleChangeItem(i, 'texto_observaciones', e.target.value)} className="form-control form-control-sm" style={{ minWidth: '180px' }} /></td>
                <td><input type="checkbox" checked={it.adicional ?? false} onChange={e => handleChangeItem(i, 'adicional', e.target.checked)} /></td>
                <td><input type="number" value={it.cuadros_adicionales ?? ''} onChange={e => handleChangeItem(i, 'cuadros_adicionales', parseFloat(e.target.value) || '')} className="form-control form-control-sm" style={{ minWidth: '70px' }} /></td>
                <td><input type="number" value={it.cantidad ?? ''} onChange={e => handleChangeItem(i, 'cantidad', parseFloat(e.target.value) || '')} className="form-control form-control-sm" style={{ minWidth: '70px' }} /></td>
                <td><input type="number" value={it.precio_unitario ?? ''} onChange={e => handleChangeItem(i, 'precio_unitario', parseFloat(e.target.value) || '')} className="form-control form-control-sm" style={{ minWidth: '80px' }} /></td>
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

export default EditarItemsPresupuestoPage;
