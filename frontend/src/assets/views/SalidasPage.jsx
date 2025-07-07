import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SalidasPage = () => {
  const [materiales, setMateriales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);

  const [codigo, setCodigo] = useState('');
  const [producto, setProducto] = useState('');
  const [cantidadSalida, setCantidadSalida] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState('');

  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');

  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState('');
  const [presupuestoNumero, setPresupuestoNumero] = useState('');
  const [nombreObra, setNombreObra] = useState('');
  const [observacion, setObservacion] = useState('');

  useEffect(() => {
    axios.get('http://localhost:4000/api/materiales')
      .then(res => setMateriales(res.data))
      .catch(err => console.error('Error al cargar materiales:', err));

    axios.get('http://localhost:4000/api/clientes')
      .then(res => setClientes(res.data))
      .catch(err => console.error('Error al cargar clientes:', err));
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      const cliente = clientes.find(c => c.id === parseInt(clienteSeleccionado));
      setClienteNombre(cliente?.nombre || '');
      axios.get(`http://localhost:4000/api/presupuestos/cliente/${clienteSeleccionado}`)
        .then(res => setPresupuestos(res.data))
        .catch(err => console.error('Error al obtener presupuestos:', err));
    } else {
      setPresupuestos([]);
      setClienteNombre('');
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    const presupuesto = presupuestos.find(p => p.id === parseInt(presupuestoSeleccionado));
    setPresupuestoNumero(presupuesto?.numero || '');
    setNombreObra(presupuesto?.nombre_obra || '');
    setObservacion(presupuesto?.observacion || '');
  }, [presupuestoSeleccionado]);

  const obtenerPrecioUltimo = async (codigo) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/precio-material?codigo=${codigo}`);
      return res.data.precio_unitario;
    } catch (error) {
      console.error('Error al obtener precio desde backend:', error);
      return '';
    }
  };

  const handleCodigoChange = async (valor) => {
    const m = materiales.find(m => m.codigo.toString() === valor);
    const precio = m?.precio_unitario || await obtenerPrecioUltimo(valor);
    setCodigo(valor);
    setProducto(m?.producto || '');
    setPrecioUnitario(precio);
  };

  const handleProductoChange = async (valor) => {
    const m = materiales.find(m => m.producto === valor);
    const precio = m?.precio_unitario || (m?.codigo ? await obtenerPrecioUltimo(m.codigo) : '');
    setProducto(valor);
    setCodigo(m?.codigo || '');
    setPrecioUnitario(precio);
  };

  const handleSubmit = async () => {
    if (!codigo || !producto || !cantidadSalida || !clienteSeleccionado || !presupuestoSeleccionado) {
      alert('Completa todos los campos requeridos');
      return;
    }

    try {
      const clienteId = parseInt(clienteSeleccionado);
      const presupuestoId = parseInt(presupuestoSeleccionado);

      const res = await axios.post('http://localhost:4000/api/registro_salida', {
        codigo,
        producto,
        cantidad_salida: parseInt(cantidadSalida),
        cliente_id: clienteId,
        presupuesto_id: presupuestoId,
        cliente_nombre: clienteNombre,
        presupuesto_numero: presupuestoNumero,
        nombre_obra: nombreObra,
        precio_unitario: parseInt(precioUnitario),
        observacion: observacion?.trim() || ''
      });

      alert(res.data.message || 'Salida registrada correctamente');
      setCantidadSalida('');
      setCodigo('');
      setProducto('');
      setPrecioUnitario('');
      setObservacion('');
    } catch (error) {
      console.error('Error al registrar salida:', error);
      alert('Error al registrar salida');
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Registrar Salida de Material</h2>

      <div className="row mb-3">
        <div className="col-md-3">
          <label>Código</label>
          <input
            className="form-control"
            list="lista_codigos"
            value={codigo}
            onInput={(e) => handleCodigoChange(e.target.value)}
          />
          <datalist id="lista_codigos">
            {materiales.map(m => (
              <option key={m.codigo} value={m.codigo} />
            ))}
          </datalist>
        </div>

        <div className="col-md-3">
          <label>Producto</label>
          <input
            className="form-control"
            list="lista_productos"
            value={producto}
            onInput={(e) => handleProductoChange(e.target.value)}
          />
          <datalist id="lista_productos">
            {materiales.map(m => (
              <option key={m.producto} value={m.producto} />
            ))}
          </datalist>
        </div>

        <div className="col-md-3">
          <label>Cantidad salida</label>
          <input
            type="number"
            className="form-control"
            value={cantidadSalida}
            onChange={(e) => setCantidadSalida(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label>Precio unitario</label>
          <input
            type="number"
            className="form-control"
            value={precioUnitario}
            onChange={(e) => setPrecioUnitario(e.target.value)}
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label>Cliente</label>
          <select
            className="form-control"
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(e.target.value)}
          >
            <option value="">Seleccionar cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label>Presupuesto</label>
          <select
            className="form-control"
            value={presupuestoSeleccionado}
            onChange={(e) => setPresupuestoSeleccionado(e.target.value)}
          >
            <option value="">Seleccionar presupuesto</option>
            {presupuestos.map(p => (
              <option key={p.id} value={p.id}>{p.numero}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label>Observaciones</label>
        <textarea
          className="form-control"
          rows="2"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        />
      </div>

      <div className="text-center">
        <button className="btn btn-success" onClick={handleSubmit}>
          Cargar salida
        </button>
      </div>
    </div>
  );
};

export default SalidasPage;
