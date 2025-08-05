import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { generarPDF_OC } from '../utils/generarPDF_OC';

const CrearOCPage = () => {
  const [materiales, setMateriales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState('');
  const [presupuestoNumero, setPresupuestoNumero] = useState('');
  const [items, setItems] = useState([]);
  const [item, setItem] = useState({ codigo: '', producto: '', cantidad: '', precio_unitario: '', unidad: 'UN' });
  const [proveedor, setProveedor] = useState('');
  const [rutProveedor, setRutProveedor] = useState('');
  const [comentario, setComentario] = useState('');
  const [realizadoPor, setRealizadoPor] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [totales, setTotales] = useState({ neto: 0, iva: 0, total: 0 });
  const [numeroOC, setNumeroOC] = useState('');
  const [esNuevoProducto, setEsNuevoProducto] = useState(false);
  const [advertenciaProductoExistente, setAdvertenciaProductoExistente] = useState('');
  const [bancoProveedor, setBancoProveedor] = useState('');
  const [cuentaProveedor, setCuentaProveedor] = useState('');



  const API = import.meta.env.VITE_API_URL;

  const camposObligatoriosIncompletos = () => {
    if (!clienteSeleccionado || !presupuestoSeleccionado || !proveedor.trim() || !realizadoPor.trim()) return true;
    if (items.length === 0) return true;
    for (let i of items) {
      if (!i.codigo || !i.producto || !i.cantidad || !i.precio_unitario) return true;
    }
    return false;
  };

  useEffect(() => {
    axios.get(`${API}api/materiales`).then(res => setMateriales(res.data));
    axios.get(`${API}api/proveedores`).then(res => setProveedores(res.data));
    axios.get(`${API}api/clientes`).then(res => setClientes(res.data));
    axios.get(`${API}api/ultima_oc`).then(res => {
      const ultimo = parseInt(res.data.ultimo || 0);
      setNumeroOC((ultimo + 1).toString());
    });
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      const cliente = clientes.find(c => c.id === parseInt(clienteSeleccionado));
      setClienteNombre(cliente?.nombre || '');
      axios.get(`${API}api/presupuestos/cliente/${clienteSeleccionado}`).then(res => setPresupuestos(res.data));
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    if (presupuestoSeleccionado) {
      const presupuesto = presupuestos.find(p => p.id === parseInt(presupuestoSeleccionado));
      setPresupuestoNumero(presupuesto?.numero || '');
    }
  }, [presupuestoSeleccionado]);

  useEffect(() => {
    const neto = items.reduce((sum, i) => {
      const cantidad = parseFloat(i.cantidad) || 0;
      const precio = parseFloat(i.precio_unitario) || 0;
      return sum + (cantidad * precio);
    }, 0);
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;
    setTotales({ neto, iva, total });
  }, [items]);

  const obtenerPrecioUltimo = async (codigo) => {
    if (esNuevoProducto) return '';
    if (!codigo) return '';
    try {
      const res = await axios.get(`${API}api/precio-material?codigo=${codigo}`);
      return res.data.precio_unitario;
    } catch (error) {
      console.warn('Error al obtener precio:', error.response?.status === 404 ? 'Material no encontrado' : error);
      return '';
    }
  };

  const handleCodigoChange = async (codigo) => {
    if (esNuevoProducto) {
      setItem(prev => ({ ...prev, codigo }));
      const existe = materiales.some(m => m.codigo === codigo);
      setAdvertenciaProductoExistente(existe ? '⚠️ Este código ya existe en la base de datos.' : '');
    } else {
      const m = materiales.find(m => m.codigo === codigo);
      const precio = m?.precio_unitario || await obtenerPrecioUltimo(codigo);
      setItem({ ...item, codigo, producto: m?.producto || '', precio_unitario: precio });
      setAdvertenciaProductoExistente('');
    }
  };

  const handleProductoChange = async (producto) => {
    if (esNuevoProducto) {
      setItem(prev => ({ ...prev, producto }));
      const existe = materiales.some(m => m.producto === producto);
      setAdvertenciaProductoExistente(existe ? '⚠️ Este nombre de producto ya existe.' : '');
    } else {
      const m = materiales.find(m => m.producto === producto);
      const precio = m?.precio_unitario || (m?.codigo ? await obtenerPrecioUltimo(m.codigo) : '');
      setItem({ ...item, producto, codigo: m?.codigo || '', precio_unitario: precio });
      setAdvertenciaProductoExistente('');
    }
  };

  const handleAgregarItem = async () => {
    if (!item.codigo || !item.producto || !item.cantidad || !item.precio_unitario) {
      alert('Por favor completa todos los campos del ítem.');
      return;
    }

    const existeMaterial = materiales.some(mat => mat.codigo?.trim() === item.codigo.trim());

    if (!existeMaterial && esNuevoProducto) {
      const confirmar = window.confirm(`El código "${item.codigo}" no existe. ¿Deseas crear este nuevo material?`);

      if (confirmar) {
        try {
        await axios.post(`${API}api/materiales`, {
          codigo: item.codigo.trim(),
          producto: item.producto.trim()
        });

          const res = await axios.get(`${API}api/materiales`);
          setMateriales(res.data);
        } catch (error) {
          console.error('Error al crear nuevo material:', error);
          alert('Hubo un error al crear el nuevo material.');
          return;
        }
      } else {
        return; // Cancelado por el usuario
      }
    }

    setItems(prev => [
      ...prev,
      {
        ...item,
        cantidad: parseFloat(item.cantidad),
        precio_unitario: parseFloat(item.precio_unitario),
        total: parseFloat(item.cantidad) * parseFloat(item.precio_unitario),
      }
    ]);

    setItem({ codigo: '', producto: '', cantidad: '', precio_unitario: '', unidad: 'UN' });
    setAdvertenciaProductoExistente('');
  };

  const eliminarItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

const guardarOC = async () => {
  if (!clienteSeleccionado.trim() || !presupuestoSeleccionado.trim()) {
    alert('Debes seleccionar un cliente y un presupuesto antes de guardar la OC.');
    return;
  }

  if (!proveedores.some(p => p.proveedor.trim().toLowerCase() === proveedor.trim().toLowerCase())) {
    alert('El proveedor ingresado no es válido o no existe en la base de datos.');
    return;
  }

    try {
      const itemsConExtras = items.map(i => ({
        ...i,
        costo_neto: (parseFloat(i.cantidad) || 0) * (parseFloat(i.precio_unitario) || 0),
        observacion: comentario?.trim() || `${clienteNombre} - Presupuesto ${presupuestoNumero}`
      }));

      const response = await axios.post(`${API}api/ordenes_compra`, {
        numero_oc: numeroOC,
        proveedor,
        fecha,
        realizado_por: realizadoPor,
        comentario,
        cliente_id: clienteNombre,
        numero_presupuesto: presupuestoNumero,
        items: itemsConExtras
      });

      alert(`OC N° ${response.data.numero_oc} creada con éxito.`);
      window.location.reload();

      // ✅ Generar PDF con RUT
      generarPDF_OC({
        numeroOC,
        proveedor,
        rutProveedor,
        fecha,
        realizadoPor,
        clienteNombre,
        presupuestoNumero,
        items,
        totales,
        comentario
      });

      setItems([]);
    } catch (error) {
      console.error('Error al guardar OC:', error);
      alert('Hubo un error al guardar la OC. Revisa la consola.');
    }
  };


return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Crear Orden de Compra</h2>

      <div className="row mb-3">
        <div className="col-md-2">
          <label>N° OC</label>
          <input type="text" className="form-control" value={numeroOC} onChange={(e) => setNumeroOC(e.target.value)} placeholder="Número OC" />
        </div>
        <div className="col-md-4">
          <label>Proveedor</label>
         <input
            type="text"
            className="form-control"
            list="lista_proveedores"
            value={proveedor}
            onChange={(e) => {
              const nombre = e.target.value;
              setProveedor(nombre);

              const prov = proveedores.find(
                p => p.proveedor && p.proveedor.trim().toLowerCase() === nombre.trim().toLowerCase()
              );

              setRutProveedor(prov?.rut || '');
              setBancoProveedor(prov?.banco || '');
              setCuentaProveedor(prov?.numero_cuenta || '');
            }}
            placeholder="Buscar proveedor"
          />
          <small className="text-muted">RUT: {rutProveedor}</small>
          <datalist id="lista_proveedores">
            {proveedores.map(p => (
              <option key={p.id} value={p.proveedor} />
            ))}
          </datalist>
        </div>
        <div className="col-md-3">
          <label>Fecha</label>
          <input type="date" className="form-control" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label>Realizado por</label>
          <input type="text" className="form-control" value={realizadoPor} onChange={(e) => setRealizadoPor(e.target.value)} />
        </div>
      </div>

      <div className="form-check form-switch d-flex align-items-center gap-2 my-2">
        <input
          className="form-check-input"
          type="checkbox"
          id="nuevoProductoToggle"
          checked={esNuevoProducto}
          onChange={() => setEsNuevoProducto(!esNuevoProducto)}
        />
        <label className="form-check-label mb-0" htmlFor="nuevoProductoToggle">
          Nuevo producto
        </label>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label>Código</label>
          <input
            type="text"
            className="form-control"
            list="codigos"
            value={item.codigo}
            onChange={(e) => {
              const codigo = e.target.value;
              setItem(prev => ({ ...prev, codigo })); // Solo actualiza valor, sin lógica pesada
            }}
            onBlur={async () => {
              if (!item.codigo || esNuevoProducto) return;

              const m = materiales.find(m => m.codigo === item.codigo);
              if (m) {
                setItem(prev => ({
                  ...prev,
                  producto: m.producto,
                  precio_unitario: m.precio_unitario
                }));
                setAdvertenciaProductoExistente('');
              } else {
                const precio = await obtenerPrecioUltimo(item.codigo);
                setItem(prev => ({
                  ...prev,
                  producto: '',
                  precio_unitario: precio
                }));
                setAdvertenciaProductoExistente('');
              }
            }}
            placeholder="Código del producto"
          />
          <datalist id="codigos">
            {materiales.map(m => <option key={m.codigo} value={m.codigo} />)}
          </datalist>
        </div>

        <div className="col-md-4">
          <label>Producto</label>
          <input type="text" className="form-control" list="productos" value={item.producto} onChange={async (e) => {
            const producto = e.target.value;

          if (esNuevoProducto) {
            setItem(prev => ({ ...prev, producto }));
            const existe = materiales.some(m => m.producto === producto);
            setAdvertenciaProductoExistente(existe ? '⚠️ Este nombre de producto ya existe.' : '');
            return;
          }


            const m = materiales.find(m => m.producto === producto);
            const precio = m?.precio_unitario || (m?.codigo ? await obtenerPrecioUltimo(m.codigo) : '');
            setItem({ ...item, producto, codigo: m?.codigo || '', precio_unitario: precio });
            setAdvertenciaProductoExistente('');
          }}   placeholder="Nombre del producto" />
          <datalist id="productos">
            {materiales.map(m => <option key={m.producto} value={m.producto} />)}
          </datalist>
        </div>
        <div className="col-md-2">
          <label>Cantidad</label>
          <input
            type="text"
            inputMode="decimal"
            className="form-control"
            placeholder="Cantidad"
            value={item.cantidad}
            onChange={(e) => {
              const valor = e.target.value.replace(',', '.');
              if (!isNaN(valor) || valor === '') {
                setItem({ ...item, cantidad: valor });
              }
            }}
          />

        </div>
        <div className="col-md-2">
          <label>Precio Neto</label>
          <input
            type="text"
            inputMode="decimal"
            className="form-control"
            placeholder="Precio neto"
            value={item.precio_unitario}
            onChange={(e) => {
              const valor = e.target.value.replace(',', '.'); // permite usar coma
              if (!isNaN(valor) || valor === '') {
                setItem({ ...item, precio_unitario: valor });
              }
            }}
          />
        </div>
      </div>

      {advertenciaProductoExistente && (
        <div className="alert alert-warning py-1 mt-1" role="alert">
          {advertenciaProductoExistente}
        </div>
      )}

      <button
        className="btn btn-primary mb-3"
        onClick={handleAgregarItem}
        disabled={
          !item.codigo || !item.producto || !item.cantidad || !item.precio_unitario ||
          (esNuevoProducto && advertenciaProductoExistente)
        }
      >
        Añadir elemento
      </button>


      {items.length > 0 && (
        <table className="table table-bordered table-hover text-center">
          <thead className="table-dark">
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Precio Total</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx}>
                <td>{i.codigo}</td>
                <td>{i.producto}</td>
                <td>{i.cantidad}</td>
                <td>${parseFloat(i.precio_unitario)}</td>
                <td>${(i.cantidad * i.precio_unitario)}</td>
                <td><button className="btn btn-sm btn-danger" onClick={() => eliminarItem(idx)}>X</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="text-end me-3">
        <p><strong>Total Neto:</strong> ${totales.neto.toLocaleString()}</p>
        <p><strong>IVA 19%:</strong> ${totales.iva.toLocaleString()}</p>
        <p><strong>TOTAL:</strong> ${totales.total.toLocaleString()}</p>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label>Cliente</label>
          <input
            type="text"
            className="form-control"
            list="clientes_datalist"
            value={clienteNombre}
            onChange={(e) => {
              const nombre = e.target.value;
              setClienteNombre(nombre);
              const cliente = clientes.find(c => c.nombre === nombre);
              setClienteSeleccionado(cliente?.id || '');
              if (cliente) {
                axios.get(`${API}api/presupuestos/cliente/${cliente.id}`).then(res => setPresupuestos(res.data));
              }
            }}
            placeholder="Buscar cliente"
          />
          <datalist id="clientes_datalist">
            {clientes.map(c => (
              <option key={c.id} value={c.nombre} />
            ))}
          </datalist>
        </div>

        <div className="col-md-6">
          <label>Presupuesto</label>
          <select className="form-control" value={presupuestoSeleccionado} onChange={(e) => setPresupuestoSeleccionado(e.target.value)}>
            <option value="">Seleccionar presupuesto</option>
            {presupuestos.map(p => <option key={p.id} value={p.id}>{p.numero}</option>)}
          </select>
        </div>
      </div>

      <label>Comentario</label>
      <textarea className="form-control mb-3" rows="2" value={comentario} onChange={(e) => setComentario(e.target.value)} />

      <button
        className="btn btn-success"
        onClick={guardarOC}
        disabled={camposObligatoriosIncompletos()}
      >
        Guardar Orden de Compra
      </button>

      <button
        className="btn btn-secondary ms-2"
        onClick={() =>
          generarPDF_OC({
            numeroOC,
            proveedor,
            rutProveedor,
            bancoProveedor,
            cuentaProveedor,
            fecha,
            realizadoPor,
            clienteNombre,
            presupuestoNumero,
            items,
            totales,
            comentario,
          })
        }
      >
        Generar PDF
      </button>
    </div>
  );
};

export default CrearOCPage;