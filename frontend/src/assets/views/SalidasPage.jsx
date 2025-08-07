import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SalidasPage = () => {
  const [materiales, setMateriales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);

  const [codigo, setCodigo] = useState('');
  const [producto, setProducto] = useState('');
  const [cantidadSalida, setCantidadSalida] = useState('');

  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');

  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState('');
  const [presupuestoNumero, setPresupuestoNumero] = useState('');
  const [nombreObra, setNombreObra] = useState('');
  const [observacion, setObservacion] = useState('');
  const [salidasHistorico, setSalidasHistorico] = useState([]);
  const [clienteTexto, setClienteTexto] = useState('');

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${API}api/materiales`)
      .then(res => setMateriales(res.data))
      .catch(err => console.error('Error al cargar materiales:', err));

    axios.get(`${API}api/clientes`)
      .then(res => setClientes(res.data))
      .catch(err => console.error('Error al cargar clientes:', err));

    axios.get(`${API}api/salidas_inventario2`)
      .then(res => setSalidasHistorico(res.data))
      .catch(err => console.error('Error al cargar salidas:', err));
  }, []);

  useEffect(() => {
    const cliente = clientes.find(c => c.id.toString() === clienteSeleccionado);
    setClienteNombre(cliente?.nombre || '');
    setClienteTexto(cliente?.nombre || '');

    if (clienteSeleccionado) {
      axios
        .get(`${API}api/presupuestos/cliente/${clienteSeleccionado}`)
        .then((res) => setPresupuestos(res.data))
        .catch((err) => console.error('Error al obtener presupuestos:', err));
    } else {
      setPresupuestos([]);
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    const presupuesto = presupuestos.find(p => p.id === parseInt(presupuestoSeleccionado));
    setPresupuestoNumero(presupuesto?.numero || '');
    setNombreObra(presupuesto?.nombre_obra || '');
    setObservacion(presupuesto?.observacion || '');
  }, [presupuestoSeleccionado]);

  useEffect(() => {
    if (!codigo) return;
    const m = materiales.find(m => m.codigo.toString() === codigo);
    if (m) {
      setProducto(m.producto);
    } else {
      obtenerPrecioUltimo(codigo).then(precio => {
        setProducto('');
      });
    }
  }, [codigo]);

  useEffect(() => {
    if (!producto) return;
    const m = materiales.find(m => m.producto === producto);
    if (m) {
      setCodigo(m.codigo);
    } else {
      setCodigo('');
    }
  }, [producto]);

  const obtenerPrecioUltimo = async (codigo) => {
    try {
      const res = await axios.get(`${API}api/precio-material?codigo=${codigo}`);
      return res.data.precio_unitario;
    } catch (error) {
      console.error('Error al obtener precio desde backend:', error);
      return '';
    }
  };

  const handleSubmit = async () => {
    if (!codigo || !producto || !cantidadSalida || !clienteSeleccionado || !presupuestoSeleccionado) {
      alert('Completa todos los campos requeridos');
      return;
    }

    try {
      const clienteId = parseInt(clienteSeleccionado);
      const presupuestoId = parseInt(presupuestoSeleccionado);

      const res = await axios.post(`${API}api/registro_salida`, {
        codigo,
        producto,
        cantidad_salida: parseInt(cantidadSalida),
        cliente_id: clienteId,
        presupuesto_id: presupuestoId,
        cliente_nombre: clienteNombre,
        presupuesto_numero: presupuestoNumero,
        nombre_obra: nombreObra,
        observacion: observacion?.trim() || ''
      });

      alert(res.data.message || 'Salida registrada correctamente');
      setCantidadSalida('');
      setCodigo('');
      setProducto('');
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
            onChange={(e) => setCodigo(e.target.value)}
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
            onChange={(e) => setProducto(e.target.value)}
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
      </div>

      <div className="row mb-3">
        <div className="col-md-6 mb-3">
          <label>Buscar cliente</label>
          <input
            className="form-control"
            list="lista_clientes"
            value={clienteTexto}
            onChange={(e) => {
              const nombreIngresado = e.target.value;
              setClienteTexto(nombreIngresado);

              const cliente = clientes.find(c => c.nombre === nombreIngresado);
              if (cliente) {
                setClienteSeleccionado(cliente.id.toString());
              } else {
                setClienteSeleccionado('');
              }
            }}
            placeholder="Escriba nombre del cliente"
          />
          <datalist id="lista_clientes">
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.nombre} />
            ))}
          </datalist>
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

      <div className="mt-5">
        <h4>Historial de Salidas</h4>
        <div className="table-responsive">
          <table className="table table-bordered table-sm">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>N° Presupuesto</th>
                <th>Obra</th>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Neto</th>
              </tr>
            </thead>
            <tbody>
              {salidasHistorico.map((s, idx) => (
                <tr key={idx}>
                  <td>{new Date(s.fecha).toLocaleDateString()}</td>
                  <td>{s.cliente_nombre}</td>
                  <td>{s.presupuesto_numero}</td>
                  <td>{s.nombre_obra}</td>
                  <td>{s.codigo}</td>
                  <td>{s.producto}</td>
                  <td>{s.cantidad}</td>
                  <td>${s.precio_neto?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalidasPage;
