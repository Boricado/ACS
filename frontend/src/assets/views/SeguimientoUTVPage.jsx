import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Collapse from 'bootstrap/js/dist/collapse'

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  fecha.setHours(fecha.getHours() + 4); // Sumar 4 horas (corrige UTC-4)
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}-${mes}-${anio}`;
};

const obtenerFechaHoy = () => {
  return new Date().toISOString().split('T')[0];
};

const SeguimientoUTVPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const [fechaActual] = useState(obtenerFechaHoy());
  const refUTVAccordion = useRef(null);
  const [termoData, setTermoData] = useState([]);

  const [utv, setUTV] = useState({
    fecha: obtenerFechaHoy(), nombre_pauta: '', numero_pauta: '', tipo: 'PVC',
    doble_corredera: 0, proyectante: 0, fijo: 0, oscilobatiente: 0,
    doble_corredera_fijo: 0, marco_puerta: 0, marco_adicionales: 0, otro: 0,
    observacion_marcos: '', observacion_otro: '', valor_m2: 3000
  });

  const [termopanel, setTermopanel] = useState({
    fecha: obtenerFechaHoy(), nombre_cliente: '', cantidad: 0, ancho: 0, alto: 0,
    m2: 0, observacion: '', valor_m2: 1500
  });

  const [utvData, setUtvData] = useState([]);
  const [termopanelData, setTermopanelData] = useState([]);
  const [instalacionData, setInstalacionData] = useState([]);

  const [mes, setMes] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [mesFiltro, setMesFiltro] = useState(mes);
  const [anioFiltro, setAnioFiltro] = useState(anio);


  const handleChange = (e, setter) => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value }));
  };

  const mapUTVtoBackend = () => ({
    fecha: utv.fecha,
    nombre_pauta: utv.nombre_pauta,
    numero_pauta: utv.numero_pauta,
    tipo: utv.tipo,
    doble_corredera: utv.doble_corredera,
    proyectante: utv.proyectante,
    fijo: utv.fijo,
    oscilobatiente: utv.oscilobatiente,
    doble_corredera_fijo: utv.doble_corredera_fijo,
    marco_puerta: utv.marco_puerta,
    marcos_adicionales: utv.marco_adicionales,
    comentario_marcos: utv.observacion_marcos,
    otro: utv.otro,
    comentario_otro: utv.observacion_otro,
    valor_m2: utv.valor_m2
  });

  const mapTermopanelToBackend = () => ({
    fecha: termopanel.fecha,
    cliente: termopanel.nombre_cliente,
    cantidad: termopanel.cantidad,
    ancho_mm: termopanel.ancho,
    alto_mm: termopanel.alto,
    m2: termopanel.m2,
    observaciones: termopanel.observacion,
    valor_m2: termopanel.valor_m2
  });

  const mapInstalacionToBackend = () => ({
    fecha: instalacion.fecha,
    cliente: instalacion.nombre_cliente,
    m2: instalacion.m2_rectificacion,
    observaciones: instalacion.observacion,
    valor_m2: instalacion.valor_m2
  });

    const registrarUTV = async () => {
        try {
            if (modoEdicion && idEditando) {
            await axios.put(`${API}api/taller/utv/${idEditando}`, utv);
            } else {
            await axios.post(`${API}api/taller/utv`, utv);
            }

            await cargarRegistros(); // recarga la tabla
            setUTV({ ...formularioVacio }); // limpia el formulario
            setModoEdicion(false);
            setIdEditando(null);
        } catch (error) {
            console.error('Error al guardar UTV:', error);
        }
        };

        const editarRegistro = (item) => {
        setUTV({
            fecha: item.fecha ? item.fecha.split('T')[0] : '', // ✅ importante
            // los demás campos igual que antes...
            nombre_pauta: item.nombre_pauta,
            numero_pauta: item.numero_pauta,
            tipo: item.tipo,
            fijo: item.fijo,
            doble_corredera_fijo: item.doble_corredera_fijo,
            proyectante: item.proyectante,
            oscilobatiente: item.oscilobatiente,
            doble_corredera: item.doble_corredera,
            marco_puerta: item.marco_puerta,
            marcos_adicionales: item.marcos_adicionales,
            comentario_marcos: item.comentario_marcos,
            otro: item.otro,
            comentario_otro: item.comentario_otro,
            valor_m2: item.valor_m2,
            m2_instalador: item.m2_instalador || 0,
        });

        setModoEdicion(true);
        setIdEditando(item.id);

        // Mostrar el acordeón
        const collapseEl = document.getElementById('collapseUTV');
        if (collapseEl && !collapseEl.classList.contains('show')) {
            const collapse = new Collapse(collapseEl, { toggle: true });
            collapse.show();
        }

        // 📜 Hacer scroll hacia la sección
        setTimeout(() => {
            refUTVAccordion.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300); // espera a que el acordeón se despliegue
        };



    const eliminarRegistro = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
        await axios.delete(`${API}api/taller/utv/${id}`);
        await cargarRegistros(); // recarga tabla después de eliminar
    } catch (error) {
        console.error('Error al eliminar UTV:', error);
        alert('No se pudo eliminar el registro.');
    }
    };



  const registrarTermopanel = async () => {
    try {
      await axios.post(`${API}api/taller/termopanel`, mapTermopanelToBackend());
      alert('Termopanel registrado correctamente');
      obtenerDatos();
    } catch (error) {
      console.error('Error al registrar termopanel:', error);
      alert('Error al guardar termopanel.');
    }
  };

    const cargarTermos = async () => {
    try {
        const res = await axios.get(`${API}api/taller/termopanel?mes=${filtroMes}&anio=${filtroAnio}`);
        setTermoData(res.data);
    } catch (error) {
        console.error('Error al cargar datos de termopanel:', error);
    }
    };

    const editarTermo = (item) => {
    setModoEdicionTermo(true);
    setTermoEditando(item);
    // Opcional: despliegue acordeón de edición
    };

    const eliminarTermo = async (id) => {
    if (window.confirm('¿Deseas eliminar este registro termo?')) {
        await axios.delete(`${API}api/taller/termopanel/${id}`);
        await cargarTermos(); // vuelve a cargar
    }
    };


  const registrarInstalacion = async () => {
    try {
      await axios.post(`${API}api/taller/instalaciones`, mapInstalacionToBackend());
      alert('Instalación registrada correctamente');
      obtenerDatos();
    } catch (error) {
      console.error('Error al registrar instalación:', error);
      alert('Error al guardar instalación.');
    }
  };

  const obtenerDatos = async () => {
    const params = { mes: mesFiltro, anio: anioFiltro };
    try {
      const [utvRes, termoRes, instRes] = await Promise.all([
        axios.get(`${API}api/taller/utv`, { params }),
        axios.get(`${API}api/taller/termopanel`, { params }),
        axios.get(`${API}api/taller/instalaciones`, { params })
      ]);
      setUtvData(utvRes.data);
      setTermopanelData(termoRes.data);
      setInstalacionData(instRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos del taller.');
    }
  };

    const cargarRegistros = async () => {
      try {
        const res = await axios.get(`${API}api/taller/utv?mes=${mesFiltro}&anio=${anioFiltro}`);
        setUtvData(res.data);
      } catch (error) {
        console.error('Error al cargar registros UTV:', error);
        // Manejar el error, por ejemplo, mostrando un mensaje al usuario
      }
    };

  useEffect(() => {
    obtenerDatos();
    cargarTermos();
    }, [mesFiltro, anioFiltro]);

const calcularUTV = (item) => {
    const fijo = parseFloat(item.fijo || 0) * 0.5;
    const fijoCorredera = parseFloat(item.doble_corredera_fijo || 0) * 1.5;
    const proyectante = parseFloat(item.proyectante || 0) * 1;
    const oscilobatiente = parseFloat(item.oscilobatiente || 0) * 1;
    const dobleCorredera = parseFloat(item.doble_corredera || 0) * 2;
    const marcoPuerta = parseFloat(item.marco_puerta || 0) * 2.5;
    const marcoAdicional = parseFloat(item.marcos_adicionales || 0) * 0.5;
    const otro = parseFloat(item.otro || 0) * 0.25;

    return fijo + fijoCorredera + proyectante + oscilobatiente + dobleCorredera + marcoPuerta + marcoAdicional + otro;
};

const sumaUTV = utvData.reduce((acc, item) => acc + calcularUTV(item), 0);
const totalUTV = utvData.reduce((acc, item) => acc + calcularUTV(item) * parseFloat(item.valor_m2 || 0), 0);
const totalTermopanel = termoData.reduce((sum, t) => sum + Number(t.m2), 0);
const totalInstalacion = instalacionData.reduce((acc, item) => acc + parseFloat(item.m2_rectificacion || 0) * parseFloat(item.valor_m2 || 0), 0);

const [modoEdicion, setModoEdicion] = useState(false);
const [idEditando, setIdEditando] = useState(null);

useEffect(() => {
    const ancho = parseFloat(termopanel.ancho) || 0;
    const alto = parseFloat(termopanel.alto) || 0;
    const m2 = ((ancho / 1000) * (alto / 1000)).toFixed(2); // convierte de mm a m y calcula m2

    setTermopanel(prev => ({ ...prev, m2 }));
}, [termopanel.ancho, termopanel.alto]);


return (
  <div className="container">
    <h2 className="mt-4">Seguimiento de UTV - Ingreso de Datos</h2>

    <h4 className="mt-4">Registrar Datos</h4>
    <div className="row">

      {/* Formulario UTV */}
      <div className="accordion my-3" id="accordionUTV">
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingUTV">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseUTV" aria-expanded="false" aria-controls="collapseUTV">
              Registrar UTV
            </button>
          </h2>
          <div
            id="collapseUTV"
            className="accordion-collapse collapse"
            aria-labelledby="headingUTV"
            data-bs-parent="#accordionUTV"
            ref={refUTVAccordion}
            >
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
                    { name: "fijo", label: "Fijo (0.5 UTV)" },
                    { name: "doble_corredera_fijo", label: "Fijo + corredera (1.5 UTV)" },
                    { name: "proyectante", label: "Proyectante (0.5 UTV)" },
                    { name: "oscilobatiente", label: "Oscilobatiente (1 UTV)" },
                    { name: "doble_corredera", label: "Doble Corredera (2 UTV)" },
                    { name: "marco_puerta", label: "Marco Puerta (2.5 UTV)" }
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

                  {/* Marco Adicionales con observación */}
                  <div className="d-flex mb-2 align-items-center">
                    <input
                      type="number"
                      className="form-control me-2"
                      style={{ width: '80px' }}
                      name="marcos_adicionales (0.5 UTV)"
                      value={utv.marcos_adicionales || 0}
                      onChange={e => handleChange(e, setUTV)}
                    />
                    <span className="me-2">Marco Adicionales</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Obs. Marcos"
                      name="comentario_marcos"
                      value={utv.comentario_marcos}
                      onChange={e => handleChange(e, setUTV)}
                    />
                  </div>

                  {/* Otro con observación */}
                  <div className="d-flex mb-2 align-items-center">
                    <input
                      type="number"
                      className="form-control me-2"
                      style={{ width: '80px' }}
                      name="otro  (0.25 UTV)"
                      value={utv.otro || 0}
                      onChange={e => handleChange(e, setUTV)}
                    />
                    <span className="me-2">Otro</span>
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

                {/* Valor m2 */}
                <div className="col-md-6">
                  <div className="mb-2">
                    <label>Valor m²</label>
                    <input
                      type="number"
                      className="form-control"
                      name="valor_m2"
                      value={utv.valor_m2}
                      onChange={e => handleChange(e, setUTV)}
                    />
                  </div>
                  <div className="mb-2">
                    <label>M² Totales</label>
                    <input
                      type="number"
                      className="form-control"
                      name="m2_instalador"
                      value={utv.m2_instalador}
                      onChange={e => handleChange(e, setUTV)}
                    />
                  </div>
                </div>

                <div className="col-md-12 text-end mt-3">
                  <button
                    className="btn btn-secondary me-2"
                    onClick={() => {
                    setUTV({
                        fecha: obtenerFechaHoy(),
                        nombre_pauta: '',
                        numero_pauta: '',
                        tipo: 'PVC',
                        doble_corredera: 0,
                        proyectante: 0,
                        fijo: 0,
                        oscilobatiente: 0,
                        doble_corredera_fijo: 0,
                        marco_puerta: 0,
                        marcos_adicionales: 0,
                        comentario_marcos: '',
                        otro: 0,
                        comentario_otro: '',
                        valor_m2: 3000,
                        m2_instalador: 0,
                    });
                    setModoEdicion(false);
                    setIdEditando(null);
                    cargarRegistros(); // 🔄 opcional: refrescar tabla
                    }}
                >
                    Limpiar
                </button>
                  <button
                    className="btn btn-success"
                    onClick={async () => {
                        try {
                            await registrarUTV(); // Esta maneja tanto creación como actualización

                            alert(modoEdicion ? 'UTV actualizado con éxito' : 'UTV guardado con éxito');
                            await cargarRegistros();
                            setModoEdicion(false);
                        // Limpiar el formulario si deseas:
                        setUTV({
                          fecha: obtenerFechaHoy(),
                          nombre_pauta: '',
                          numero_pauta: '',
                          tipo: 'PVC',
                          doble_corredera: 0,
                          proyectante: 0,
                          fijo: 0,
                          oscilobatiente: 0,
                          doble_corredera_fijo: 0,
                          marco_puerta: 0,
                          marco_adicionales: 0,
                          otro: 0,
                          observacion_marcos: '',
                          observacion_otro: '',
                          valor_m2: 3000,
                          m2_instalador: 0,
                        });

                      } catch (error) {
                        console.error('Error al guardar/actualizar UTV:', error);
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

      {/* Termopanel */}
      <div className="accordion my-3" id="accordionTermopanel">
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingTermopanel">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTermopanel" aria-expanded="false" aria-controls="collapseTermopanel">
              Registrar Termopanel
            </button>
          </h2>
          <div id="collapseTermopanel" className="accordion-collapse collapse" aria-labelledby="headingTermopanel" data-bs-parent="#accordionTermopanel">
            <div className="accordion-body">
              <div className="row g-2">
                <div className="col-md-4">
                  <label>Fecha</label>
                  <input type="date" name="fecha" className="form-control" value={termopanel.fecha} onChange={(e) => handleChange(e, setTermopanel)} />
                </div>
                <div className="col-md-4">
                  <label>Cliente</label>
                  <input type="text" name="nombre_cliente" className="form-control" value={termopanel.nombre_cliente} onChange={(e) => handleChange(e, setTermopanel)} />
                </div>
                <div className="col-md-4">
                  <label>Cantidad</label>
                  <input type="number" name="cantidad" className="form-control" value={termopanel.cantidad} onChange={(e) => handleChange(e, setTermopanel)} />
                </div>
                <div className="col-md-3">
                  <label>Ancho (mm)</label>
                  <input type="number" name="ancho" className="form-control" value={termopanel.ancho} onChange={(e) => handleChange(e, setTermopanel)} />
                </div>
                <div className="col-md-3">
                  <label>Alto (mm)</label>
                  <input type="number" name="alto" className="form-control" value={termopanel.alto} onChange={(e) => handleChange(e, setTermopanel)} />
                </div>
                <div className="col-md-3">
                  <label>M²</label>
                  <input type="number" name="m2" className="form-control" value={termopanel.m2} readOnly />
                </div>
                <div className="col-md-3">
                  <label>Valor m²</label>
                  <input type="number" name="valor_m2" className="form-control" value={termopanel.valor_m2} onChange={(e) => handleChange(e, setTermopanel)} />
                </div>
                <div className="col-md-12">
                  <label>Observación</label>
                  <input type="text" name="observacion" className="form-control" value={termopanel.observacion} onChange={(e) => handleChange(e, setTermopanel)} />
                </div>
                <div className="col-md-12 text-end mt-3">
                  <button className="btn btn-success" onClick={registrarTermopanel}>Guardar Termopanel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
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

      {/* Tabla */}
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
                          const nuevoInstalador = e.target.value;
                          await axios.put(`${API}api/taller/utv/${item.id}/instalador`, {
                            instalador: nuevoInstalador,
                        });
                          await cargarRegistros(); // Recarga la tabla
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

        {/* Tabla de Registro Termo */}
        {termoData.length > 0 ? (
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
                {termoData.map(item => (
                <tr key={item.id}>
                    <td>{formatearFecha(item.fecha)}</td>
                    <td>{item.nombre_cliente}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.ancho}</td>
                    <td>{item.alto}</td>
                    <td>{((item.ancho * item.alto * item.cantidad) / 1000000).toFixed(2)}</td>
                    <td>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => editarTermo(item)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => eliminarTermo(item.id)}>🗑️ Eliminar</button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </>
        ) : (
        <p>No hay registros termo para este mes/año.</p>
        )}



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
            <td>0</td>
            <td>
              {utvData.reduce((acc, item) => acc + calcularUTV(item), 0)}
            </td>
            <td>${totalUTV.toLocaleString('es-CL')}</td>
          </tr>
          <tr>
            <td>Termopanel</td>
            <td>{termopanelData.reduce((acc, item) => acc + item.m2, 0)}</td>
            <td>-</td>
            <td>${totalTermopanel.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Instalación</td>
            <td>{instalacionData.reduce((acc, item) => acc + item.m2_rectificacion, 0)}</td>
            <td>-</td>
            <td>${totalInstalacion.toLocaleString('es-CL')}</td>
          </tr>
          <tr className="fw-bold">
            <td>Total a Pagar</td>
            <td colSpan={2}>-</td>
            <td>${(totalUTV + totalTermopanel + totalInstalacion).toLocaleString('es-CL')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);
};

export default SeguimientoUTVPage;
