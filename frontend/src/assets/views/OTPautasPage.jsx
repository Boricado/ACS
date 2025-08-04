import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OTPautasPage = () => {
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);
  const [dataPorCategoria, setDataPorCategoria] = useState({});
  const [archivoNombre, setArchivoNombre] = useState('');

  const API = import.meta.env.VITE_API_URL;

  const mapaCategorias = {
    Perfiles: 'perfiles',
    Refuerzos: 'refuerzos',
    Vidrio: 'vidrio',
    Herraje: 'herraje',
    Accesorios: 'accesorios',
    GomasCepillos: 'gomascepillos',
    Tornillos: 'tornillos',
    Instalacion: 'instalacion'
  };

  useEffect(() => {
    axios.get(`${API}api/clientes`).then(res => setClientes(res.data));
    axios.get(`${API}api/materiales`).then(res => setMateriales(res.data));
  }, []);

  useEffect(() => {
    if (clienteSeleccionado?.id) {
      axios
        .get(`${API}api/presupuestos/cliente/${clienteSeleccionado.id}`)
        .then(res => setPresupuestos(res.data));
    }
  }, [clienteSeleccionado]);

  const [materiales, setMateriales] = useState([]);

  const handleCodigoChange = (categoria, codigo, idx) => {
    const mat = materiales.find(m => m.codigo === codigo);
    const nuevos = { ...dataPorCategoria };
    nuevos[categoria][idx].codigo = codigo;
    nuevos[categoria][idx].producto = mat ? mat.producto : '';
    setDataPorCategoria(nuevos);
  };

  const handleProductoChange = (categoria, producto, idx) => {
    const mat = materiales.find(m => m.producto === producto);
    const nuevos = { ...dataPorCategoria };
    nuevos[categoria][idx].producto = producto;
    nuevos[categoria][idx].codigo = mat ? mat.codigo : '';
    setDataPorCategoria(nuevos);
  };

  const limpiarYProcesarCSV = (contenido) => {
    const lineas = contenido.split('\n');
    let categoriaActual = null;
    const resultados = {};

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      const partes = linea.split(';').map(x => x.trim());
      const clave = partes.join('').toLowerCase().replace(/\s+/g, '');

      if (Object.values(mapaCategorias).includes(clave)) {
        categoriaActual = clave;
        if (!resultados[categoriaActual]) resultados[categoriaActual] = [];
        continue;
      }

      if (/codigo/i.test(linea) && /nombre/i.test(linea)) continue;

      if (partes.length >= 11 && /^\d{5,}/.test(partes[4])) {
        const codigo = partes[4];
        const producto = partes[5];
        const cantidadRaw = partes[10];
        const original = parseFloat((cantidadRaw || '').replace(',', '.'));
        if (codigo && producto && !isNaN(original)) {
          let cantidad = original;
          if (categoriaActual === 'perfiles' || categoriaActual === 'refuerzos') {
            cantidad = Math.ceil(original / 5.8);
          } else {
            cantidad = Math.ceil(original);
          }
          resultados[categoriaActual].push({ codigo, producto, cantidad, cantidadOriginal: original });
        }
      }
    }

    return resultados;
  };

  const handleFileChange = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setArchivoNombre(archivo.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target.result;
      const procesado = limpiarYProcesarCSV(contenido);
      setDataPorCategoria(procesado);
    };
    reader.readAsText(archivo, 'ISO-8859-1');
  };

  const agregarItemManual = (categoria) => {
    const nuevo = { ...dataPorCategoria };
    if (!nuevo[categoria]) nuevo[categoria] = [];
    nuevo[categoria].push({ codigo: '', producto: '', cantidad: 1, cantidadOriginal: 1 });
    setDataPorCategoria(nuevo);
  };

  const guardarTodo = async () => {
    const cliente_id = clienteSeleccionado?.id;
    const presupuesto_id = presupuestoSeleccionado?.id;
    const numero_presupuesto = presupuestoSeleccionado?.numero;

    if (!cliente_id || !presupuesto_id || !numero_presupuesto) {
      alert('Debe seleccionar cliente y presupuesto.');
      return;
    }

    try {
      for (const categoria in dataPorCategoria) {
        const payload = {
          cliente_id,
          presupuesto_id,
          numero_presupuesto,
          items: dataPorCategoria[categoria]
        };
        await axios.post(`${API}api/ot_pautas/${categoria}/lote`, payload);
      }
      alert('Carga completada');
      setDataPorCategoria({});
    } catch (err) {
      alert('Error en carga por lote');
    }
  };

  return (
    <div className="container mt-4">
      <h4>Pautas de Oficina Técnica</h4>

      <div className="row mb-3">
        <div className="col-md-4">
          <label>Cliente</label>
          <select className="form-select" value={clienteSeleccionado?.id || ''} onChange={(e) => {
            const cliente = clientes.find(c => c.id === parseInt(e.target.value));
            setClienteSeleccionado(cliente || null);
          }}>
            <option value=''>Seleccionar cliente</option>
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
            <option value=''>Seleccionar presupuesto</option>
            {presupuestos.map(p => (
              <option key={p.id} value={p.id}>{p.numero}</option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label>Cargar desde CSV</label>
          <input type="file" accept=".csv" className="form-control" onChange={handleFileChange} />
          {archivoNombre && <p className="small mt-1">Archivo: <strong>{archivoNombre}</strong></p>}
        </div>
      </div>

      {Object.keys(dataPorCategoria).map(categoria => (
        <div key={categoria} className="mb-4">
          <h5>{categoria.toUpperCase()}</h5>
          <table className="table table-sm table-bordered">
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
              {dataPorCategoria[categoria].map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      list="codigos"
                      className="form-control form-control-sm"
                      value={item.codigo}
                      onChange={e => handleCodigoChange(categoria, e.target.value, idx)}
                    />
                  </td>
                  <td>
                    <input
                      list="productos"
                      className="form-control form-control-sm"
                      value={item.producto}
                      onChange={e => handleProductoChange(categoria, e.target.value, idx)}
                    />
                  </td>
                  <td>{item.cantidadOriginal}</td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      min="0"
                      step="1"
                      value={item.cantidad}
                      onChange={(e) => {
                        const nueva = { ...dataPorCategoria };
                        nueva[categoria][idx].cantidad = parseInt(e.target.value) || 0;
                        setDataPorCategoria(nueva);
                      }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        const nueva = { ...dataPorCategoria };
                        nueva[categoria] = nueva[categoria].filter((_, i) => i !== idx);
                        setDataPorCategoria(nueva);
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="6" className="text-end">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => agregarItemManual(categoria)}
                  >
                    + Añadir Manualmente
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      {Object.keys(dataPorCategoria).length > 0 && (
        <button className="btn btn-success" onClick={guardarTodo}>Guardar TODO (por lote)</button>
      )}

      <datalist id="codigos">
        {materiales.map(m => <option key={m.codigo} value={m.codigo} />)}
      </datalist>
      <datalist id="productos">
        {materiales.map(m => <option key={m.producto} value={m.producto} />)}
      </datalist>
    </div>
  );
};

export default OTPautasPage;
