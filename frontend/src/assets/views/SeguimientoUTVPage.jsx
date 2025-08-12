// frontend/src/assets/views/SeguimientoUTVPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Collapse from 'bootstrap/js/dist/collapse';
import { generarPDF_UTV } from '../utils/generarPDF_UTV';

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  fecha.setHours(fecha.getHours() + 4); // corrige UTC-4
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}-${mes}-${anio}`;
};

const obtenerFechaHoy = () => new Date().toISOString().split('T')[0];

// Estado inicial UTV (para limpiar sin errores)
const INICIAL_UTV = {
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
  marcos_adicionales: 0,   // <- usar SIEMPRE "marcos_adicionales"
  comentario_marcos: '',
  otro: 0,
  comentario_otro: '',
  valor_m2: 3000,
  m2_instalador: 0,
};

const SeguimientoUTVPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const refUTVAccordion = useRef(null);

  // --- Termo ---
  const [termoData, setTermoData] = useState([]);

  const totalM2Termo = termoData.reduce((acum, item) => {
    const ancho = parseFloat(item.ancho_mm) || 0;
    const alto = parseFloat(item.alto_mm) || 0;
    const cantidad = parseInt(item.cantidad) || 1;
    const m2 = (ancho * alto * cantidad) / 1_000_000;
    return acum + m2;
  }, 0);

  const totalValorTermo = termoData.reduce((acum, item) => {
    const valorM2 = parseFloat(item.valor_m2) || 0;
    const ancho = parseFloat(item.ancho_mm) || 0;
    const alto = parseFloat(item.alto_mm) || 0;
    const cantidad = parseInt(item.cantidad) || 1;
    const m2 = (ancho * alto * cantidad) / 1_000_000;
    return acum + m2 * valorM2;
  }, 0);

  // --- Formularios ---
  const [utv, setUTV] = useState(INICIAL_UTV);

  const [termopanel, setTermopanel] = useState({
    fecha: obtenerFechaHoy(),
    nombre_cliente: '',
    cantidad: 0,
    ancho: 0,
    alto: 0,
    m2: 0,
    observacion: '',
    valor_m2: 1500,
  });

  // --- Datos listados ---
  const [utvData, setUtvData] = useState([]);
  const [termopanelData, setTermopanelData] = useState([]);
  const [instalacionData, setInstalacionData] = useState([]);

  // --- Filtros ---
  const [mes, setMes] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [mesFiltro, setMesFiltro] = useState(mes);
  const [anioFiltro, setAnioFiltro] = useState(anio);

  const handleChange = (e, setter) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  // map a backend (UTV y Termo)
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
    marcos_adicionales: utv.marcos_adicionales,
    comentario_marcos: utv.comentario_marcos,
    otro: utv.otro,
    comentario_otro: utv.comentario_otro,
    valor_m2: utv.valor_m2,
    m2_instalador: utv.m2_instalador,
  });

  const mapTermopanelToBackend = () => ({
    fecha: termopanel.fecha,
    cliente: termopanel.nombre_cliente,
    cantidad: termopanel.cantidad,
    ancho_mm: termopanel.ancho,
    alto_mm: termopanel.alto,
    m2: termopanel.m2,
    observaciones: termopanel.observacion,
    valor_m2: termopanel.valor_m2,
  });

  // --- CRUD UTV ---
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const registrarUTV = async () => {
    try {
      if (modoEdicion && idEditando) {
        await axios.put(`${API}api/taller/utv/${idEditando}`, mapUTVtoBackend());
      } else {
        await axios.post(`${API}api/taller/utv`, mapUTVtoBackend());
      }
      await cargarRegistros();
      setUTV(INICIAL_UTV);
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
      comentario_marcos: item.comentario_marcos || '',
      otro: item.otro,
      comentario_otro: item.comentario_otro || '',
      valor_m2: item.valor_m2,
      m2_instalador: item.m2_instalador || 0,
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

  // --- Termopanel helpers ---
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
      const res = await axios.get(`${API}api/taller/termopanel?mes=${mesFiltro}&anio=${anioFiltro}`);
      setTermoData(res.data);
    } catch (error) {
      console.error('Error al cargar datos de termopanel:', error);
    }
  };

  const [modoEdicionTermo, setModoEdicionTermo] = useState(false);
  const [termoEditando, setTermoEditando] = useState(null);

  const editarTermo = (item) => {
    setModoEdicionTermo(true);
    setTermoEditando(item);
    // (si más adelante quieres abrir un acordeón de edición, ya está listo)
  };

  const eliminarTermo = async (id) => {
    if (window.confirm('¿Deseas eliminar este registro termo?')) {
      await axios.delete(`${API}api/taller/termopanel/${id}`);
      await cargarTermos();
    }
  };

  // --- Carga inicial / por filtros ---
  const obtenerDatos = async () => {
    const params = { mes: mesFiltro, anio: anioFiltro };
    try {
      const [utvRes, termoRes, instRes] = await Promise.all([
        axios.get(`${API}api/taller/utv`, { params }),
        axios.get(`${API}api/taller/termopanel`, { params }),
        axios.get(`${API}api/taller/instalaciones`, { params }),
      ]);
      setUtvData(utvRes.data || []);
      setTermopanelData(termoRes.data || []);
      setInstalacionData(instRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos del taller.');
    }
  };

  const cargarRegistros = async () => {
    try {
      const res = await axios.get(`${API}api/taller/utv?mes=${mesFiltro}&anio=${anioFiltro}`);
      setUtvData(res.data || []);
    } catch (error) {
      console.error('Error al cargar registros UTV:', error);
    }
  };

  useEffect(() => {
    obtenerDatos();
    cargarTermos();
  }, [mesFiltro, anioFiltro]);

  // --- Cálculos UTV ---
  const calcularUTV = (item) => {
    const fijo = parseFloat(item.fijo || 0) * 0.5;
    const fijoCorredera = parseFloat(item.doble_corredera_fijo || 0) * 1.5;
    const proyectante = parseFloat(item.proyectante || 0) * 1; // tu lógica original
    const oscilobatiente = parseFloat(item.oscilobatiente || 0) * 1;
    const dobleCorredera = parseFloat(item.doble_corredera || 0) * 2;
    const marcoPuerta = parseFloat(item.marco_puerta || 0) * 2.5;
    const marcoAdicional = parseFloat(item.marcos_adicionales || 0) * 0.5;
    const otro = parseFloat(item.otro || 0) * 0.25;
    return fijo + fijoCorredera + proyectante + oscilobatiente + dobleCorredera + marcoPuerta + marcoAdicional + otro;
  };

  const totalUTV = utvData.reduce(
    (acc, item) => acc + calcularUTV(item) * parseFloat(item.valor_m2 || 0),
    0
  );

  // Instalaciones
  const totalM2Instalaciones = instalacionData.reduce(
    (acum, item) => acum + (parseFloat(item.m2_rectificacion) || 0),
    0
  );
  const valorAcumuladoInstalaciones = instalacionData.reduce((acum, item) => {
    const m2 = parseFloat(item.m2_rectificacion) || 0;
    const valorM2 = parseFloat(item.valor_m2) || 0;
    return acum + valorM2 * m2;
  }, 0);

  // UTV Alumce (si aplica)
  const utvAlumce = utvData.filter((item) => item.instalador === 'Alumce');
  const totalM2Alumce = utvAlumce.reduce((a, it) => a + (parseFloat(it.m2_instalador) || 0), 0);
  const valorAcumuladoAlumce = utvAlumce.reduce((a, it) => {
    const valorM2 = parseFloat(it.valor_m2) || 0;
    const m2 = parseFloat(it.m2_instalador) || 0;
    return a + valorM2 * m2;
  }, 0);

  const totalM2InstalacionesConAlumce = totalM2Instalaciones + totalM2Alumce;
  const valorAcumuladoInstalacionesConAlumce =
    valorAcumuladoInstalaciones + valorAcumuladoAlumce;

  // Recalcular m2 termo al cambiar ancho/alto
  useEffect(() => {
    const ancho = parseFloat(termopanel.ancho) || 0;
    const alto = parseFloat(termopanel.alto) || 0;
    const m2 = ((ancho / 1000) * (alto / 1000)).toFixed(2);
    setTermopanel((prev) => ({ ...prev, m2 }));
  }, [termopanel.ancho, termopanel.alto]);

  // --- PDF Pago UTV por asistencia ---
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [utvAcum, setUtvAcum] = useState(0);      // UTV totales del mes (se autocalcula)
  const [valorUTV, setValorUTV] = useState(3000); // $ por UTV
  const [cargando, setCargando] = useState(false);

  // al cambiar filtros, sincroniza periodo del PDF
  useEffect(() => {
    setPeriodo(`${anioFiltro}-${mesFiltro}`);
  }, [mesFiltro, anioFiltro]);

  // calcula automáticamente la suma de UTV del mes
  useEffect(() => {
    const suma = utvData.reduce((acc, item) => acc + calcularUTV(item), 0);
    setUtvAcum(Number(suma.toFixed(2)));
  }, [utvData]);

const generar = async () => {
  try {
    setCargando(true);

    // 1) Resumen desde lo visible en pantalla (asegurando números)
    const sumaUTVMes = utvData.reduce((acc, it) => acc + calcularUTV(it), 0);

    const resumen = {
      utv: { suma: Number(sumaUTVMes || 0), valor: Number(totalUTV || 0) },
      termopanel: { m2: Number(totalM2Termo || 0), valor: Number(totalValorTermo || 0) },
      instalacion: {
        m2: Number(totalM2InstalacionesConAlumce || 0),
        valor: Number(valorAcumuladoInstalacionesConAlumce || 0),
      },
    };
    resumen.total =
      Number(resumen.utv.valor) +
      Number(resumen.termopanel.valor) +
      Number(resumen.instalacion.valor);

    // 2) Asistencia del mes
    const res = await axios.get(`${API}api/trabajadores`, { params: { periodo } });
    const base = res.data || [];

    // 3) Recalcular horas y distribuir proporcional al total a pagar
    const enriquecidos = base.map((t) => {
      const dias = Number(t.dias_trab) || 0;
      const horasTrab = dias * 9;
      const horasExtras = Number(t.horas_extras) || 0;
      const horasRetraso = Number(t.horas_retraso) || 0;
      const horasAcum = horasTrab + horasExtras - horasRetraso;
      const pctAsist = horasTrab > 0 ? horasAcum / horasTrab : 0;
      return {
        ...t,
        horas_trab: horasTrab,
        horas_extras: horasExtras,
        horas_retraso: horasRetraso,
        horas_acum_trab: horasAcum,
        pct_asist: pctAsist,
      };
    });

    const sumHorasAcum = enriquecidos.reduce(
      (s, t) => s + Math.max(0, t.horas_acum_trab || 0),
      0
    );

    const conPago = enriquecidos.map((t) => {
      const factor = Math.max(0, t.horas_acum_trab || 0);
      const pago = sumHorasAcum > 0 ? resumen.total * (factor / sumHorasAcum) : 0;
      return { ...t, pago };
    });

    // 4) Generar PDF
    generarPDF_UTV({ periodo, resumen, trabajadores: conPago });
  } catch (e) {
    console.error(e);
    alert('No se pudo generar el PDF.');
  } finally {
    setCargando(false);
  }
};



  const totalInstalacion = valorAcumuladoInstalacionesConAlumce;

  return (
    <div className="container">
      <h2 className="mt-4">Seguimiento de UTV - Ingreso de Datos</h2>

      {/* === Bloque PDF Pago UTV por asistencia === */}
      <div className="row g-3 align-items-end border rounded p-3 mt-3">
        <div className="col-md-3">
          <label>Periodo</label>
          <input
            type="month"
            className="form-control"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <button
            className="btn btn-primary w-100"
            onClick={generar}
            disabled={cargando}
          >
            {cargando ? 'Generando...' : 'Generar PDF Pago UTV'}
          </button>
        </div>
      </div>

      <h4 className="mt-4">Registrar Datos</h4>
      <div className="row">
        {/* Formulario UTV */}
        <div className="accordion my-3" id="accordionUTV">
          <div className="accordion-item">
            <h2 className="accordion-header" id="headingUTV">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseUTV"
                aria-expanded="false"
                aria-controls="collapseUTV"
              >
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
                    <input
                      type="date"
                      className="form-control"
                      name="fecha"
                      value={utv.fecha}
                      onChange={(e) => handleChange(e, setUTV)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label>Nombre Pauta</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre_pauta"
                      value={utv.nombre_pauta}
                      onChange={(e) => handleChange(e, setUTV)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label>N° Pauta</label>
                    <input
                      type="text"
                      className="form-control"
                      name="numero_pauta"
                      value={utv.numero_pauta}
                      onChange={(e) => handleChange(e, setUTV)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label>Tipo</label>
                    <select
                      className="form-select"
                      name="tipo"
                      value={utv.tipo}
                      onChange={(e) => handleChange(e, setUTV)}
                    >
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
                      { name: 'proyectante', label: 'Proyectante (0.5 UTV)' },
                      { name: 'oscilobatiente', label: 'Oscilobatiente (1 UTV)' },
                      { name: 'doble_corredera', label: 'Doble Corredera (2 UTV)' },
                      { name: 'marco_puerta', label: 'Marco Puerta (2.5 UTV)' },
                    ].map((item, idx) => (
                      <div className="d-flex mb-2 align-items-center" key={idx}>
                        <input
                          type="number"
                          className="form-control me-2"
                          style={{ width: '80px' }}
                          name={item.name}
                          value={utv[item.name] || 0}
                          onChange={(e) => handleChange(e, setUTV)}
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
                        onChange={(e) => handleChange(e, setUTV)}
                      />
                      <span className="me-2">Marco Adicionales (0.5 UTV)</span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Obs. Marcos"
                        name="comentario_marcos"
                        value={utv.comentario_marcos}
                        onChange={(e) => handleChange(e, setUTV)}
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
                        onChange={(e) => handleChange(e, setUTV)}
                      />
                      <span className="me-2">Otro (0.25 UTV)</span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Obs. Otro"
                        name="comentario_otro"
                        value={utv.comentario_otro}
                        onChange={(e) => handleChange(e, setUTV)}
                      />
                    </div>
                  </div>

                  {/* Valor m2 y m2 instalador */}
                  <div className="col-md-6">
                    <div className="mb-2">
                      <label>Valor m²</label>
                      <input
                        type="number"
                        className="form-control"
                        name="valor_m2"
                        value={utv.valor_m2}
                        onChange={(e) => handleChange(e, setUTV)}
                      />
                    </div>
                    <div className="mb-2">
                      <label>M² Totales</label>
                      <input
                        type="number"
                        className="form-control"
                        name="m2_instalador"
                        value={utv.m2_instalador}
                        onChange={(e) => handleChange(e, setUTV)}
                      />
                    </div>
                  </div>

                  <div className="col-md-12 text-end mt-3">
                    <button
                      className="btn btn-secondary me-2"
                      onClick={() => {
                        setUTV(INICIAL_UTV);
                        setModoEdicion(false);
                        setIdEditando(null);
                        cargarRegistros();
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
                          await cargarRegistros();
                          setModoEdicion(false);
                          setUTV(INICIAL_UTV);
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
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseTermopanel"
                aria-expanded="false"
                aria-controls="collapseTermopanel"
              >
                Registrar Termopanel
              </button>
            </h2>
            <div
              id="collapseTermopanel"
              className="accordion-collapse collapse"
              aria-labelledby="headingTermopanel"
              data-bs-parent="#accordionTermopanel"
            >
              <div className="accordion-body">
                <div className="row g-2">
                  <div className="col-md-4">
                    <label>Fecha</label>
                    <input
                      type="date"
                      name="fecha"
                      className="form-control"
                      value={termopanel.fecha}
                      onChange={(e) => handleChange(e, setTermopanel)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label>Cliente</label>
                    <input
                      type="text"
                      name="nombre_cliente"
                      className="form-control"
                      value={termopanel.nombre_cliente}
                      onChange={(e) => handleChange(e, setTermopanel)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label>Cantidad</label>
                    <input
                      type="number"
                      name="cantidad"
                      className="form-control"
                      value={termopanel.cantidad}
                      onChange={(e) => handleChange(e, setTermopanel)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label>Ancho (mm)</label>
                    <input
                      type="number"
                      name="ancho"
                      className="form-control"
                      value={termopanel.ancho}
                      onChange={(e) => handleChange(e, setTermopanel)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label>Alto (mm)</label>
                    <input
                      type="number"
                      name="alto"
                      className="form-control"
                      value={termopanel.alto}
                      onChange={(e) => handleChange(e, setTermopanel)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label>M²</label>
                    <input type="number" name="m2" className="form-control" value={termopanel.m2} readOnly />
                  </div>
                  <div className="col-md-3">
                    <label>Valor m²</label>
                    <input
                      type="number"
                      name="valor_m2"
                      className="form-control"
                      value={termopanel.valor_m2}
                      onChange={(e) => handleChange(e, setTermopanel)}
                    />
                  </div>
                  <div className="col-md-12">
                    <label>Observación</label>
                    <input
                      type="text"
                      name="observacion"
                      className="form-control"
                      value={termopanel.observacion}
                      onChange={(e) => handleChange(e, setTermopanel)}
                    />
                  </div>
                  <div className="col-md-12 text-end mt-3">
                    <button className="btn btn-success" onClick={registrarTermopanel}>
                      Guardar Termopanel
                    </button>
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
            <select className="form-select" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
              {[...Array(12)].map((_, i) => (
                <option key={i} value={(i + 1).toString().padStart(2, '0')}>
                  {(i + 1).toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label>Año</label>
            <select className="form-select" value={anioFiltro} onChange={(e) => setAnioFiltro(e.target.value)}>
              {[2024, 2025, 2026].map((a) => (
                <option key={a} value={a.toString()}>
                  {a}
                </option>
              ))}
            </select>
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
                {utvData.map((item) => (
                  <tr key={item.id}>
                    <td>{formatearFecha(item.fecha)}</td>
                    <td>{item.nombre_pauta}</td>
                    <td>{item.tipo}</td>
                    <td>{calcularUTV(item)}</td>
                    <td>{item.m2_instalador || '-'}</td>
                    <td>
                      <button className="btn btn-warning btn-sm me-2" onClick={() => editarRegistro(item)}>
                        ✏️ Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminarRegistro(item.id)}>
                        🗑️ Eliminar
                      </button>
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
                {termoData.map((item) => {
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
                        <button className="btn btn-warning btn-sm me-2" onClick={() => editarTermo(item)}>
                          ✏️ Editar
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => eliminarTermo(item.id)}>
                          🗑️ Eliminar
                        </button>
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
    </div>
  );
};

export default SeguimientoUTVPage;
