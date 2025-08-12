// src/pages/SeguimientoUTVPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Collapse from 'bootstrap/js/dist/collapse';
import { generarPDF_UTV } from '../utils/generarPDF_UTV';

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  fecha.setHours(fecha.getHours() + 4); // corrige UTC-4
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}-${mes}-${anio}`;
};
const obtenerFechaHoy = () => new Date().toISOString().split('T')[0];

const SeguimientoUTVPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const refUTVAccordion = useRef(null);

  // ---------- Estados ----------
  const formularioVacio = {
    fecha: obtenerFechaHoy(),
    nombre_pauta: '',
    numero_pauta: '',
    tipo: 'PVC',
    fijo: 0,
    doble_corredera_fijo: 0,
    proyectante: 0,
    oscilobatiente: 0,
    doble_corredera: 0,
    marco_puerta: 0,
    marcos_adicionales: 0,
    comentario_marcos: '',
    otro: 0,
    comentario_otro: '',
    valor_m2: 3000,
    m2_instalador: 0,
    instalador: ''
  };
  const [utv, setUTV] = useState({ ...formularioVacio });

  const [termopanel, setTermopanel] = useState({
    fecha: obtenerFechaHoy(),
    nombre_cliente: '',
    cantidad: 0,
    ancho: 0,
    alto: 0,
    m2: 0,
    observacion: '',
    valor_m2: 1500
  });

  const [instalacion, setInstalacion] = useState({
    fecha: obtenerFechaHoy(),
    nombre_cliente: '',
    m2_rectificacion: 0,
    observacion: '',
    valor_m2: 3000
  });

  const [utvData, setUtvData] = useState([]);
  const [termopanelData, setTermopanelData] = useState([]);
  const [instalacionData, setInstalacionData] = useState([]);

  const [mesFiltro, setMesFiltro] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [anioFiltro, setAnioFiltro] = useState(String(new Date().getFullYear()));

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  // Controles PDF
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [utvAcum, setUtvAcum] = useState(0);
  const [valorUTV, setValorUTV] = useState(3000);
  const [cargando, setCargando] = useState(false);

  // ---------- Helpers ----------
  const handleChange = (e, setter) => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value }));
  };

  const calcularUTV = (item) => {
    const fijo = parseFloat(item.fijo || 0) * 0.5;
    const fijoCorredera = parseFloat(item.doble_corredera_fijo || 0) * 1.5;
    const proyectante = parseFloat(item.proyectante || 0) * 1;     // 1 UTV
    const oscilobatiente = parseFloat(item.oscilobatiente || 0) * 1;
    const dobleCorredera = parseFloat(item.doble_corredera || 0) * 2;
    const marcoPuerta = parseFloat(item.marco_puerta || 0) * 2.5;
    const marcoAdicional = parseFloat(item.marcos_adicionales || 0) * 0.5;
    const otro = parseFloat(item.otro || 0) * 0.25;
    return fijo + fijoCorredera + proyectante + oscilobatiente + dobleCorredera + marcoPuerta + marcoAdicional + otro;
  };

  // ---------- CRUD UTV ----------
  const cargarRegistros = async () => {
    try {
      const res = await axios.get(`${API}api/taller/utv?mes=${mesFiltro}&anio=${anioFiltro}`);
      setUtvData(res.data || []);
    } catch (error) {
      console.error('Error al cargar registros UTV:', error);
    }
  };

  const registrarUTV = async () => {
    try {
      if (modoEdicion && idEditando) {
        await axios.put(`${API}api/taller/utv/${idEditando}`, utv);
      } else {
        await axios.post(`${API}api/taller/utv`, utv);
      }
      await cargarRegistros();
      setUTV({ ...formularioVacio });
      setModoEdicion(false);
      setIdEditando(null);
    } catch (error) {
      console.error('Error al guardar UTV:', error);
      throw error;
    }
  };

  const editarRegistro = (item) => {
    setUTV({
      fecha: item.fecha ? item.fecha.split('T')[0] : obtenerFechaHoy(),
      nombre_pauta: item.nombre_pauta || '',
      numero_pauta: item.numero_pauta || '',
      tipo: item.tipo || 'PVC',
      fijo: item.fijo || 0,
      doble_corredera_fijo: item.doble_corredera_fijo || 0,
      proyectante: item.proyectante || 0,
      oscilobatiente: item.oscilobatiente || 0,
      doble_corredera: item.doble_corredera || 0,
      marco_puerta: item.marco_puerta || 0,
      marcos_adicionales: item.marcos_adicionales || 0,
      comentario_marcos: item.comentario_marcos || '',
      otro: item.otro || 0,
      comentario_otro: item.comentario_otro || '',
      valor_m2: item.valor_m2 || 3000,
      m2_instalador: item.m2_instalador || 0,
      instalador: item.instalador || ''
    });
    setModoEdicion(true);
    setIdEditando(item.id);
    const collapseEl = document.getElementById('collapseUTV');
    if (collapseEl && !collapseEl.classList.contains('show')) {
      const collapse = new Collapse(collapseEl, { toggle: true });
      collapse.show();
    }
    setTimeout(() => {
      refUTVAccordion.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const eliminarRegistro = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await axios.delete(`${API}api/taller/utv/${id}`);
      await cargarRegistros();
    } catch (error) {
      console.error('Error al eliminar UTV:', error);
      alert('No se pudo eliminar el registro.');
    }
  };

  // ---------- Termopanel ----------
  const registrarTermopanel = async () => {
    try {
      await axios.post(`${API}api/taller/termopanel`, {
        fecha: termopanel.fecha,
        cliente: termopanel.nombre_cliente,
        cantidad: termopanel.cantidad,
        ancho_mm: termopanel.ancho,
        alto_mm: termopanel.alto,
        m2: termopanel.m2,
        observaciones: termopanel.observacion,
        valor_m2: termopanel.valor_m2
      });
      await obtenerDatos();
      alert('Termopanel registrado correctamente');
    } catch (error) {
      console.error('Error al registrar termopanel:', error);
      alert('Error al guardar termopanel.');
    }
  };

  const cargarTermos = async () => {
    try {
      const res = await axios.get(`${API}api/taller/termopanel?mes=${mesFiltro}&anio=${anioFiltro}`);
      setTermopanelData(res.data || []);
    } catch (error) {
      console.error('Error al cargar termopanel:', error);
    }
  };

  const editarTermo = (item) => {
    // si quieres abrir acordeón de edición, agrégalo aquí
    console.log('editarTermo', item);
  };

  const eliminarTermo = async (id) => {
    if (window.confirm('¿Deseas eliminar este registro termo?')) {
      await axios.delete(`${API}api/taller/termopanel/${id}`);
      await cargarTermos();
    }
  };

  // ---------- Instalaciones ----------
  const registrarInstalacion = async () => {
    try {
      await axios.post(`${API}api/taller/instalaciones`, {
        fecha: instalacion.fecha,
        cliente: instalacion.nombre_cliente,
        m2: instalacion.m2_rectificacion,
        observaciones: instalacion.observacion,
        valor_m2: instalacion.valor_m2
      });
      await obtenerDatos();
      alert('Instalación registrada correctamente');
    } catch (error) {
      console.error('Error al registrar instalación:', error);
      alert('Error al guardar instalación.');
    }
  };

  // ---------- Carga general ----------
  const obtenerDatos = async () => {
    const params = { mes: mesFiltro, anio: anioFiltro };
    try {
      const [utvRes, termoRes, instRes] = await Promise.all([
        axios.get(`${API}api/taller/utv`, { params }),
        axios.get(`${API}api/taller/termopanel`, { params }),
        axios.get(`${API}api/taller/instalaciones`, { params })
      ]);
      setUtvData(utvRes.data || []);
      setTermopanelData(termoRes.data || []);
      setInstalacionData(instRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos del taller.');
    }
  };

  useEffect(() => {
    obtenerDatos();
    cargarTermos();
  }, [mesFiltro, anioFiltro]);

  // Recalcular m2 de termopanel cuando cambia ancho/alto
  useEffect(() => {
    const ancho = parseFloat(termopanel.ancho) || 0;
    const alto = parseFloat(termopanel.alto) || 0;
    const m2 = ((ancho / 1000) * (alto / 1000)).toFixed(2);
    setTermopanel(prev => ({ ...prev, m2 }));
  }, [termopanel.ancho, termopanel.alto]);

  // ---------- Totales ----------
  const totalUTV = utvData.reduce((acc, item) => acc + calcularUTV(item) * parseFloat(item.valor_m2 || 0), 0);

  const totalM2Termo = termopanelData.reduce((acum, item) => {
    const ancho = parseFloat(item.ancho_mm) || 0;
    const alto = parseFloat(item.alto_mm) || 0;
    const cantidad = parseInt(item.cantidad) || 1;
    const m2 = (ancho * alto * cantidad) / 1_000_000;
    return acum + m2;
  }, 0);
  const totalValorTermo = termopanelData.reduce((acum, item) => {
    const ancho = parseFloat(item.ancho_mm) || 0;
    const alto = parseFloat(item.alto_mm) || 0;
    const cantidad = parseInt(item.cantidad) || 1;
    const m2 = (ancho * alto * cantidad) / 1_000_000;
    const valorM2 = parseFloat(item.valor_m2) || 0;
    return acum + m2 * valorM2;
  }, 0);

  // Instalaciones normales
  const totalM2Instalaciones = instalacionData.reduce((acum, item) => acum + (parseFloat(item.m2_rectificacion) || 0), 0);
  const valorAcumuladoInstalaciones = instalacionData.reduce((acum, item) => {
    const m2 = parseFloat(item.m2_rectificacion) || 0;
    const valorM2 = parseFloat(item.valor_m2) || 0;
    return acum + (valorM2 * m2);
  }, 0);

  // UTV marcadas como "Alumce"
  const utvAlumce = utvData.filter(item => item.instalador === 'Alumce');
  const totalM2Alumce = utvAlumce.reduce((acum, item) => acum + (parseFloat(item.m2_instalador) || 0), 0);
  const valorAcumuladoAlumce = utvAlumce.reduce((acum, item) => {
    const valorM2 = parseFloat(item.valor_m2) || 0;
    const m2 = parseFloat(item.m2_instalador) || 0;
    return acum + (valorM2 * m2);
  }, 0);

  const totalM2InstalacionesConAlumce = totalM2Instalaciones + totalM2Alumce;
  const valorAcumuladoInstalacionesConAlumce = valorAcumuladoInstalaciones + valorAcumuladoAlumce;

  const totalInstalacion = instalacionData.reduce(
    (acc, item) => acc + (parseFloat(item.m2_rectificacion || 0) * parseFloat(item.valor_m2 || 0)),
    0
  );

  // ---------- PDF ----------
  const generar = async () => {
    try {
      setCargando(true);
      const res = await axios.get(`${API}api/trabajadores`, { params: { periodo } });
      const trabajadores = res.data || [];
      if (trabajadores.length === 0) {
        alert('No hay trabajadores para ese mes.');
        return;
      }
      generarPDF_UTV({
        periodo,
        trabajadores,
        utvAcum: Number(utvAcum) || 0,
        valorUTV: Number(valorUTV) || 0
      });
    } catch (e) {
      console.error(e);
      alert('No se pudo generar el PDF.');
    } finally {
      setCargando(false);
    }
  };

  // ---------- Render ----------
  return (
    <div className="container">
      <h2 className="mt-4">Seguimiento de UTV - Ingreso de Datos</h2>

      {/* Controles PDF */}
      <div className="row g-2 align-items-end mt-3">
        <div className="col-auto">
          <label className="form-label">Periodo</label>
          <input type="month" className="form-control" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
        </div>
        <div className="col-auto">
          <label className="form-label">UTV acumuladas</label>
          <input type="number" step="0.1" className="form-control" value={utvAcum} onChange={(e) => setUtvAcum(e.target.value)} />
        </div>
        <div className="col-auto">
          <label className="form-label">Valor UTV ($)</label>
          <input type="number" className="form-control" value={valorUTV} onChange={(e) => setValorUTV(e.target.value)} />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary" onClick={generar} disabled={cargando}>
            {cargando ? 'Generando…' : 'Generar PDF UTV'}
          </button>
        </div>
      </div>

      {/* Filtros de tabla */}
      <div className="row my-3">
        <div className="col-md-2">
          <label>Mes</label>
          <select className="form-select" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={(i + 1).toString().padStart(2, '0')}>
                {(i + 1).toString().padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label>Año</label>
          <select className="form-select" value={anioFiltro} onChange={e => setAnioFiltro(e.target.value)}>
            {[2024, 2025, 2026].map(a => (
              <option key={a} value={a.toString()}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Acordeón UTV */}
      <div className="accordion my-3" id="accordionUTV">
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingUTV">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseUTV" aria-expanded="false" aria-controls="collapseUTV">
              Registrar UTV
            </button>
          </h2>
          <div id="collapseUTV" className="accordion-collapse collapse" aria-labelledby="headingUTV" data-bs-parent="#accordionUTV" ref={refUTVAccordion}>
            <div className="accordion-body">
              <div className="row g-2">
                {/* Cabecera */}
                <div className="col-md-3">
                  <label>Fecha</label>
                  <input type="date" className="form-control" name="fecha" value={utv.fecha} onChange={e => handleChange(e, setUTV)} />
                </div>
                <div className="col-md-3">
                  <label>Nombre Pauta</label>
                  <input type="text" className="form-control" name="nombre_pauta" value={utv.nombre_pauta} onChange={e => handleChange(e, setUTV)} />
                </div>
                <div className="col-md-3">
                  <label>N° Pauta</label>
                  <input type="text" className="form-control" name="numero_pauta" value={utv.numero_pauta} onChange={e => handleChange(e, setUTV)} />
                </div>
                <div className="col-md-3">
                  <label>Tipo</label>
                  <select className="form-select" name="tipo" value={utv.tipo} onChange={e => handleChange(e, setUTV)}>
                    <option value="PVC">PVC</option>
                    <option value="Aluminio">Aluminio</option>
                    <option value="Ambos">Ambos</option>
                  </select>
                </div>

                {/* Lista de ventanas */}
                <div className="col-md-6">
                  {[
                    { name: 'fijo', label: 'Fijo (0.5 UTV)' },
                    { name: 'doble_corredera_fijo', label: 'Fijo + corredera (1.5 UTV)' },
                    { name: 'proyectante', label: 'Proyectante (1 UTV)' },
                    { name: 'oscilobatiente', label: 'Oscilobatiente (1 UTV)' },
                    { name: 'doble_corredera', label: 'Doble Corredera (2 UTV)' },
                    { name: 'marco_puerta', label: 'Marco Puerta (2.5 UTV)' }
                  ].map((item, idx) => (
                    <div className="d-flex mb-2 align-items-center" key={idx}>
                      <input
                        type="number"
                        className="form-control me-2"
                        style={{ width: '80px' }}
                        name={item.name}
                        value={utv[item.name] || 0}
                        onChange={e => handleChange(e, setUTV)}
                      />
                      <span>{item.label}</span>
                    </div>
                  ))}

                  {/* Marcos adicionales */}
                  <div className="d-flex mb-2 align-items-center">
                    <input
                      type="number"
                      className="form-control me-2"
                      style={{ width: '80px' }}
                      name="marcos_adicionales"
                      value={utv.marcos_adicionales || 0}
                      onChange={e => handleChange(e, setUTV)}
                    />
                    <span className="me-2">Marcos Adicionales (0.5 UTV)</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Obs. Marcos"
                      name="comentario_marcos"
                      value={utv.comentario_marcos}
                      onChange={e => handleChange(e, setUTV)}
                    />
                  </div>

                  {/* Otro */}
                  <div className="d-flex mb-2 align-items-center">
                    <input
                      type="number"
                      className="form-control me-2"
                      style={{ width: '80px' }}
                      name="otro"
                      value={utv.otro || 0}
                      onChange={e => handleChange(e, setUTV)}
                    />
                    <span className="me-2">Otro (0.25 UTV)</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Obs. Otro"
                      name="comentario_otro"
                      value={utv.comentario_otro}
                      onChange={e => handleChange(e, setUTV)}
                    />
                  </div>
                </div>

                {/* Valor y m² */}
                <div className="col-md-6">
                  <div className="mb-2">
                    <label>Valor m²</label>
                    <input type="number" className="form-control" name="valor_m2" value={utv.valor_m2} onChange={e => handleChange(e, setUTV)} />
                  </div>
                  <div className="mb-2">
                    <label>M² Totales</label>
                    <input type="number" className="form-control" name="m2_instalador" value={utv.m2_instalador} onChange={e => handleChange(e, setUTV)} />
                  </div>
                </div>

                <div className="col-md-12 text-end mt-3">
                  <button
                    className="btn btn-secondary me-2"
                    onClick={() => {
                      setUTV({ ...formularioVacio });
                      setModoEdicion(false);
                      setIdEditando(null);
                    }}
                  >
                    Limpiar
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={async () => {
                      try {
                        await registrarUTV();
                        alert(modoEdicion ? 'UTV actualizado con éxito' : 'UTV guardado con éxito');
                      } catch {
                        alert('Error al guardar/actualizar UTV');
                      }
                    }}
                  >
                    {modoEdicion ? 'Actualizar UTV' : 'Guardar UTV'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla UTV */}
      {utvData.length > 0 ? (
        <>
          <h4 className="mt-4">Registros UTV</h4>
          <table className="table table-sm table-bordered">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Nombre Pauta</th>
                <th>Tipo</th>
                <th>Suma UTV</th>
                <th>M² Instalador</th>
                <th>Acciones</th>
                <th>Instalador</th>
              </tr>
            </thead>
            <tbody>
              {utvData.map(item => (
                <tr key={item.id}>
                  <td>{formatearFecha(item.fecha)}</td>
                  <td>{item.nombre_pauta}</td>
                  <td>{item.tipo}</td>
                  <td>{calcularUTV(item)}</td>
                  <td>{item.m2_instalador || '-'}</td>
                  <td>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => editarRegistro(item)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => eliminarRegistro(item.id)}>🗑️ Eliminar</button>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={item.instalador || ''}
                      onChange={async (e) => {
                        try {
                          await axios.put(`${API}api/taller/utv/${item.id}/instalador`, { instalador: e.target.value });
                          await cargarRegistros();
                        } catch (err) {
                          console.error('Error al actualizar instalador:', err);
                          alert('No se pudo actualizar el instalador.');
                        }
                      }}
                    >
                      <option value="">-</option>
                      <option value="Bernardo">Bernardo</option>
                      <option value="Alumce">Alumce</option>
                      <option value="Manuel">Manuel</option>
                      <option value="Osmani">Osmani</option>
                      <option value="José">José</option>
                      <option value="Retiro en planta">Retiro en planta</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>No hay registros para este mes/año.</p>
      )}

      {/* Tabla Termopanel */}
      {termopanelData.length > 0 ? (
        <>
          <h4 className="mt-4">Registro Termo</h4>
          <table className="table table-sm table-bordered">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Cantidad</th>
                <th>Ancho (mm)</th>
                <th>Alto (mm)</th>
                <th>M²</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {termopanelData.map(item => {
                const ancho = parseFloat(item.ancho_mm) || 0;
                const alto = parseFloat(item.alto_mm) || 0;
                const cantidad = parseInt(item.cantidad) || 1;
                const m2 = (ancho * alto * cantidad) / 1_000_000;
                return (
                  <tr key={item.id}>
                    <td>{formatearFecha(item.fecha)}</td>
                    <td>{item.cliente || '-'}</td>
                    <td>{cantidad}</td>
                    <td>{ancho > 0 ? ancho : '-'}</td>
                    <td>{alto > 0 ? alto : '-'}</td>
                    <td>{m2 > 0 ? m2.toFixed(2) : '-'}</td>
                    <td>
                      <button className="btn btn-warning btn-sm me-2" onClick={() => editarTermo(item)}>✏️ Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminarTermo(item.id)}>🗑️ Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <p>No hay registros termo para este mes/año.</p>
      )}

      {/* Resumen */}
      <h4 className="mt-4">Resumen</h4>
      <table className="table table-bordered mt-3">
        <thead className="table-light">
          <tr>
            <th>Sección</th>
            <th>Cantidad / m²</th>
            <th>Suma UTV</th>
            <th>Valor Acumulado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>UTV</td>
            <td>-</td>
            <td>{utvData.reduce((acc, item) => acc + calcularUTV(item), 0)}</td>
            <td>${totalUTV.toLocaleString('es-CL')}</td>
          </tr>
          <tr>
            <td>Termopanel</td>
            <td>{totalM2Termo.toFixed(2)}</td>
            <td>-</td>
            <td>${totalValorTermo.toLocaleString('es-CL')}</td>
          </tr>
          <tr>
            <td>Instalación</td>
            <td>{totalM2InstalacionesConAlumce.toFixed(2)}</td>
            <td>-</td>
            <td>${valorAcumuladoInstalacionesConAlumce.toLocaleString('es-CL')}</td>
          </tr>
          <tr className="fw-bold">
            <td>Total a Pagar</td>
            <td colSpan={2}>-</td>
            <td>${(totalUTV + totalValorTermo + totalInstalacion).toLocaleString('es-CL')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SeguimientoUTVPage;
