import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { generarPDF_OC } from '../utils/generarPDF_OC';

const EditarOCPage = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [numeroOCSeleccionado, setNumeroOCSeleccionado] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Pendiente');

  const [items, setItems] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [comentario, setComentario] = useState('');
  const [totales, setTotales] = useState({ neto: 0, iva: 0, total: 0 });

  // Cabecera para el PDF
  const [cabeceraOC, setCabeceraOC] = useState({
    proveedor: '',
    rutProveedor: '',
    bancoProveedor: '',
    cuentaProveedor: '',
    fecha: '',
    realizadoPor: '',
    clienteNombre: '',
    presupuestoNumero: '',
  });

  const API = import.meta.env.VITE_API_URL;

  // Cargar ordenes (según filtro) y materiales
  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const url =
          estadoFiltro === 'Todas'
            ? `${API}api/ordenes_compra`
            : `${API}api/ordenes_compra_estado?estado=${estadoFiltro}`;
        const res = await axios.get(url);
        setOrdenes(res.data || []);
      } catch {
        setOrdenes([]);
      }
    };

    fetchOrdenes();

    axios
      .get(`${API}api/materiales`)
      .then((res) => setMateriales(res.data || []))
      .catch(() => setMateriales([]));
  }, [estadoFiltro, API]);

  // Cargar ítems y cabecera al elegir una OC
  useEffect(() => {
    if (!numeroOCSeleccionado) return;

    const cargarItemsYCabecera = async () => {
      // Ítems
      try {
        const res = await axios.get(`${API}api/items_oc/${numeroOCSeleccionado}`);
        setItems(res.data || []);
        calcularTotales(res.data || []);
      } catch {
        setItems([]);
        calcularTotales([]);
      }

      // Cabecera desde lista
      const ocDeLista = ordenes.find(
        (o) => String(o.numero_oc) === String(numeroOCSeleccionado)
      );

      // Intentar endpoint de detalle (si existe)
      let detalle = {};
      try {
        const det = await axios.get(`${API}api/ordenes_compra/${numeroOCSeleccionado}`);
        detalle = det.data || {};
      } catch {
        // si no existe, sigue con lo que haya
      }

      // Normaliza campos
      const proveedor = detalle.proveedor ?? ocDeLista?.proveedor ?? '';
      const rutProveedor =
        detalle.rut_proveedor ?? detalle.rut ?? ocDeLista?.rut_proveedor ?? '';
      const bancoProveedor = detalle.banco ?? ocDeLista?.banco ?? '';
      const cuentaProveedor = detalle.numero_cuenta ?? ocDeLista?.numero_cuenta ?? '';
      const fecha = (detalle.fecha ?? ocDeLista?.fecha ?? '').toString().slice(0, 10) || '';
      const realizadoPor = detalle.realizado_por ?? ocDeLista?.realizado_por ?? '';
      // En tu lista venía "cliente_id" como texto visible; si tienes "cliente_nombre", úsalo
      const clienteNombre =
        detalle.cliente_nombre ?? ocDeLista?.cliente_nombre ?? ocDeLista?.cliente_id ?? '';
      const presupuestoNumero =
        detalle.numero_presupuesto ?? ocDeLista?.numero_presupuesto ?? '';

      setCabeceraOC({
        proveedor,
        rutProveedor,
        bancoProveedor,
        cuentaProveedor,
        fecha,
        realizadoPor,
        clienteNombre,
        presupuestoNumero,
      });

      // Precargar comentario si viene desde detalle
      if (!comentario && (detalle.comentario ?? '') !== '') {
        setComentario(detalle.comentario);
      }
    };

    cargarItemsYCabecera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeroOCSeleccionado, ordenes, API]);

  const obtenerPrecioUltimo = async (codigo) => {
    try {
      const res = await axios.get(`${API}api/precio-material?codigo=${codigo}`);
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
      const m = materiales.find((m) => m.codigo === value);
      const precio = m?.precio_unitario || (value ? await obtenerPrecioUltimo(value) : '');
      actualizados[index].producto = m ? m.producto : '';
      actualizados[index].precio_unitario = precio;
    }

    if (field === 'producto') {
      const m = materiales.find((m) => m.producto === value);
      const precio =
        m?.precio_unitario || (m?.codigo ? await obtenerPrecioUltimo(m.codigo) : '');
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
        await axios.delete(`${API}api/items_oc/${item.id}`);
      } catch (err) {
        console.error('Error al eliminar ítem:', err?.message);
      }
    }
    const actualizados = [...items];
    actualizados.splice(index, 1);
    setItems(actualizados);
    calcularTotales(actualizados);
  };

  const agregarItem = () => {
    const nuevosItems = [
      ...items,
      { codigo: '', producto: '', cantidad: '', precio_unitario: '' },
    ];
    setItems(nuevosItems);
    calcularTotales(nuevosItems);
  };

  const guardarCambios = async () => {
    try {
      for (const it of items) {
        if (it.id) {
          await axios.put(`${API}api/items_oc/${it.id}`, it);
        } else {
          await axios.post(`${API}api/items_oc`, {
            ...it,
            numero_oc: numeroOCSeleccionado,
          });
        }
      }
      if (comentario) {
        await axios.put(`${API}api/ordenes_compra/${numeroOCSeleccionado}`, { comentario });
      }
      const res = await axios.get(`${API}api/items_oc/${numeroOCSeleccionado}`);
      setItems(res.data || []);
      calcularTotales(res.data || []);
      setMensaje({ tipo: 'success', texto: 'Ítems actualizados correctamente' });
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar los cambios' });
    }
  };

  const calcularTotales = (lista) => {
    const neto = (lista || []).reduce(
      (sum, it) => sum + ((parseFloat(it.precio_unitario) || 0) * (parseFloat(it.cantidad) || 0)),
      0
    );
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;
    setTotales({ neto, iva, total });
  };

  const imprimirPDF = () => {
    const itemsSanitizados = items.map((i) => ({
      ...i,
      cantidad: parseFloat(i.cantidad) || 0,
      precio_unitario: parseFloat(i.precio_unitario) || 0,
    }));

    generarPDF_OC({
      numeroOC: numeroOCSeleccionado,
      proveedor: cabeceraOC.proveedor,
      rutProveedor: cabeceraOC.rutProveedor,
      bancoProveedor: cabeceraOC.bancoProveedor,
      cuentaProveedor: cabeceraOC.cuentaProveedor,
      fecha: cabeceraOC.fecha || new Date().toISOString().split('T')[0],
      realizadoPor: cabeceraOC.realizadoPor || '—',
      clienteNombre: cabeceraOC.clienteNombre || '',
      presupuestoNumero: cabeceraOC.presupuestoNumero || '',
      items: itemsSanitizados,
      totales,
      comentario,
    });
  };

  return (
    <div className="container mt-4">
      <h3>Editar Ítems de Orden de Compra</h3>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo === 'error' ? 'danger' : 'success'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="mb-3 d-flex gap-3">
        <select
          className="form-select w-25"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        >
          <option>Pendiente</option>
          <option>Completas</option>
          <option>Todas</option>
        </select>

        <select
          className="form-select w-50"
          value={numeroOCSeleccionado}
          onChange={(e) => setNumeroOCSeleccionado(e.target.value)}
        >
          <option value="">Seleccione N° OC</option>
          {ordenes.map((o, idx) => (
            <option key={`${o.numero_oc}-${idx}`} value={o.numero_oc}>
              {o.numero_oc} - {o.proveedor}{' '}
              ({o.cliente_nombre ?? o.cliente_id ?? 'Sin cliente'}, Ppto #{o.numero_presupuesto ?? 'N/A'})
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
                  <input
                    list="codigos"
                    value={it.codigo ?? ''}
                    onChange={(e) => handleChangeItem(i, 'codigo', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </td>
                <td>
                  <input
                    list="productos"
                    value={it.producto ?? ''}
                    onChange={(e) => handleChangeItem(i, 'producto', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={it.cantidad ?? ''}
                    onChange={(e) =>
                      handleChangeItem(i, 'cantidad', parseFloat(e.target.value) || '')
                    }
                    className="form-control form-control-sm"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={it.precio_unitario ?? ''}
                    onChange={(e) =>
                      handleChangeItem(
                        i,
                        'precio_unitario',
                        parseFloat(e.target.value) || ''
                      )
                    }
                    className="form-control form-control-sm"
                  />
                </td>
                <td>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => eliminarItem(i)}
                  >
                    Eliminar
                  </button>
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
        <p>
          <strong>Total Neto:</strong> ${totales.neto.toLocaleString('es-CL')}
        </p>
        <p>
          <strong>IVA 19%:</strong> ${totales.iva.toLocaleString('es-CL')}
        </p>
        <p>
          <strong>TOTAL:</strong> ${totales.total.toLocaleString('es-CL')}
        </p>
      </div>

      <label>Comentario</label>
      <textarea
        className="form-control mb-3"
        rows="2"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />

      <div className="d-flex justify-content-between">
        <button onClick={agregarItem} className="btn btn-outline-primary">
          Agregar Elemento
        </button>
        <div className="d-flex gap-2">
          <button onClick={imprimirPDF} className="btn btn-secondary">
            Imprimir / PDF
          </button>
          <button onClick={guardarCambios} className="btn btn-outline-success px-4">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarOCPage;
