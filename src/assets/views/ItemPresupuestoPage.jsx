import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ItemPresupuestoPage = () => {
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [item, setItem] = useState({
    presupuesto_id: '',
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
    cuadros_adicionales: 0,
    cantidad: '',
    precio_unitario: ''
  });

  const [mensaje, setMensaje] = useState(null);
  const valorUTV = 20000;

  useEffect(() => {
    axios.get('http://localhost:4000/api/clientes')
      .then(res => setClientes(res.data))
      .catch(() => setClientes([]));
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      axios.get(`http://localhost:4000/api/presupuestos/cliente/${clienteSeleccionado}`)
        .then(res => setPresupuestos(res.data))
        .catch(() => setPresupuestos([]));
    } else {
      setPresupuestos([]);
    }
  }, [clienteSeleccionado]);

  const getBaseUTV = (tipo_ventana) => {
    switch (tipo_ventana) {
      case 'Fijo': return 0.5;
      case 'Doble corredera con fijo':
      case 'Marco puerta': return 2.5;
      case 'Proyectante':
      case 'Oscilobatiente': return 1;
      case 'Doble Corredera': return 2;
      case 'Otro':
      default: return 0;
    }
  };

  const calcularUTVUnitario = () => {
    if (item.observaciones) return 0;
    const base = getBaseUTV(item.tipo_ventana);
    const adicionales = item.adicional ? (parseFloat(item.cuadros_adicionales) || 0) * 0.5 : 0;
    return base + adicionales;
  };

  const utvUnitario = calcularUTVUnitario();
  const cantidad = parseFloat(item.cantidad) || 1;
  const utv = utvUnitario * cantidad;
  const utv_monto = utv * valorUTV;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setItem(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(newValue) || '' : newValue
    }));
  };

  const guardarItem = async () => {
    const payload = {
      ...item,
      presupuesto_id: parseInt(item.presupuesto_id),
      utv,
      utv_monto
    };

    try {
      const res = await axios.post('http://localhost:4000/api/items_presupuesto', payload);
      setMensaje({ tipo: 'success', texto: 'Ítem guardado correctamente' });
      setItem({
        presupuesto_id: '',
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
        cuadros_adicionales: 0,
        cantidad: '',
        precio_unitario: ''
      });
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar ítem' });
    }
  };

  return (
    <div className="container mt-4">
      <h3>Ingreso de Ítems del Presupuesto</h3>
      {mensaje && (
        <div className={`alert alert-${mensaje.tipo === 'error' ? 'danger' : 'success'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="row">
        <div className="col-md-4 mb-3">
          <select className="form-select" value={clienteSeleccionado} onChange={e => setClienteSeleccionado(e.target.value)}>
            <option value="">Seleccione Cliente</option>
            {clientes.map(cli => (
              <option key={cli.id} value={cli.id}>
                {cli.nombre} - {cli.rut}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4 mb-3">
          <select name="presupuesto_id" className="form-select" value={item.presupuesto_id} onChange={handleChange}>
            <option value="">Seleccione Presupuesto</option>
            {presupuestos.map(p => (
              <option key={p.id} value={p.id}>
                #{p.numero} - {p.nombre_obra}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4 mb-3">
          <input name="item" className="form-control" placeholder="Ítem" value={item.item} onChange={handleChange} />
        </div>
        <div className="col-md-4 mb-3">
          <input name="recinto" className="form-control" placeholder="Recinto" value={item.recinto} onChange={handleChange} />
        </div>
        <div className="col-md-2 mb-3">
          <input type="number" name="ancho" className="form-control" placeholder="Ancho (mm)" value={item.ancho} onChange={handleChange} />
        </div>
        <div className="col-md-2 mb-3">
          <input type="number" name="alto" className="form-control" placeholder="Alto (mm)" value={item.alto} onChange={handleChange} />
        </div>

        <div className="col-md-4 mb-3">
          <select name="tipo_ventana" className="form-select" value={item.tipo_ventana} onChange={handleChange}>
            <option>Doble Corredera</option>
            <option>Proyectante</option>
            <option>Fijo</option>
            <option>Oscilobatiente</option>
            <option>Doble corredera con fijo</option>
            <option>Marco puerta</option>
            <option>Otro</option>
          </select>
        </div>

        <div className="col-md-4 mb-3">
          <select name="tipo_apertura" className="form-select" value={item.tipo_apertura} onChange={handleChange}>
            <option>Derecha</option>
            <option>Izquierda</option>
            <option>Por Definir</option>
          </select>
        </div>

        <div className="col-md-2 mb-3 form-check">
          <input type="checkbox" name="grada_buque" className="form-check-input" checked={item.grada_buque} onChange={handleChange} />
          <label className="form-check-label">Grada buque</label>
        </div>
        <div className="col-md-2 mb-3 form-check">
          <input type="checkbox" name="observaciones" className="form-check-input" checked={item.observaciones} onChange={handleChange} />
          <label className="form-check-label">Observaciones</label>
        </div>

        {item.observaciones && (
          <div className="col-md-12 mb-3">
            <textarea name="texto_observaciones" className="form-control" placeholder="Detalle observaciones" value={item.texto_observaciones} onChange={handleChange} />
          </div>
        )}

        {!item.observaciones && (
          <>
            <div className="col-md-3 mb-3 form-check">
              <input type="checkbox" name="adicional" className="form-check-input" checked={item.adicional} onChange={handleChange} />
              <label className="form-check-label">Marcos Adicionales</label>
            </div>
            {item.adicional && (
              <div className="col-md-3 mb-3">
                <input type="number" name="cuadros_adicionales" className="form-control" placeholder="Cuadros adicionales" value={item.cuadros_adicionales} onChange={handleChange} />
              </div>
            )}
          </>
        )}

        <div className="col-md-3 mb-3">
          <input type="number" name="cantidad" className="form-control" placeholder="Cantidad de ventanas" value={item.cantidad} onChange={handleChange} />
        </div>

        <div className="col-md-3 mb-3">
          <input type="number" name="precio_unitario" className="form-control" placeholder="Precio Unitario" value={item.precio_unitario} onChange={handleChange} />
        </div>

        <div className="col-md-3 mb-3">
          <input className="form-control" disabled value={`UTV total: ${utv}`} />
        </div>
        <div className="col-md-3 mb-3">
          <input className="form-control" disabled value={`Monto UTV: $${utv_monto}`} />
        </div>

        <div className="col-12">
          <button className="btn btn-primary" onClick={guardarItem}>Guardar Ítem</button>
        </div>
      </div>
    </div>
  );
};

export default ItemPresupuestoPage;
