import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SeguimientoUTVPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const [fechaActual] = useState(new Date());

  const [utv, setUTV] = useState({
    fecha: '', nombre_pauta: '', numero_pauta: '', tipo: 'PVC',
    doble_corredera: 0, proyectante: 0, fijo: 0, oscilobatiente: 0,
    doble_corredera_fijo: 0, marco_puerta: 0, marco_adicionales: 0, otro: 0,
    observacion_marcos: '', observacion_otro: '', valor_m2: 3000
  });

  const [termopanel, setTermopanel] = useState({
    fecha: '', nombre_cliente: '', cantidad: 0, ancho: 0, alto: 0,
    m2: 0, observacion: '', valor_m2: 1500
  });

  const [instalacion, setInstalacion] = useState({
    fecha: '', nombre_cliente: '', m2_rectificacion: 0,
    observacion: '', valor_m2: 3000
  });

  const [utvData, setUtvData] = useState([]);
  const [termopanelData, setTermopanelData] = useState([]);
  const [instalacionData, setInstalacionData] = useState([]);

  const [mesFiltro, setMesFiltro] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear().toString());

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
      await axios.post(`${API}api/taller/utv`, mapUTVtoBackend());
      alert('UTV registrado correctamente');
      obtenerDatos();
    } catch (error) {
      console.error('Error al registrar UTV:', error);
      alert('Error al guardar UTV.');
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

  useEffect(() => {
    obtenerDatos();
  }, [mesFiltro, anioFiltro]);

  const calcularUTV = (item) => {
    let base = 1;
    switch (item.tipo) {
      case 'Fijo': base = 0.5; break;
      case 'Doble corredera con fijo':
      case 'Marco puerta': base = 2; break;
      default: base = 1;
    }
    const adicionales = item.marcos_adicionales ? item.marcos_adicionales * 0.5 : 0;
    const utv = item.comentario_marcos || item.comentario_otro ? 0 : base + adicionales;
    return utv;
  };

  const totalUTV = utvData.reduce((acc, item) => {
    const utv = calcularUTV(item);
    return acc + utv * parseFloat(item.valor_m2 || 0);
  }, 0);

  const totalTermopanel = termopanelData.reduce((acc, item) => acc + parseFloat(item.m2 || 0) * parseFloat(item.valor_m2 || 0), 0);
  const totalInstalacion = instalacionData.reduce((acc, item) => acc + parseFloat(item.m2_rectificacion || 0) * parseFloat(item.valor_m2 || 0), 0);


  return (
    <div className="container">
      <h2 className="mt-4">Seguimiento de UTV - Ingreso de Datos</h2>

      <div className="row mb-3">
        <div className="col-md-2">
          <label>Mes</label>
          <select className="form-select" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={(i + 1).toString().padStart(2, '0')}>{(i + 1).toString().padStart(2, '0')}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label>Año</label>
          <input type="text" className="form-control" value={anioFiltro} onChange={e => setAnioFiltro(e.target.value)} />
        </div>
      </div>

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
                <div id="collapseUTV" className="accordion-collapse collapse" aria-labelledby="headingUTV" data-bs-parent="#accordionUTV">
                <div className="accordion-body">
                    <div className="row g-2">
                    <div className="col-md-4">
                        <label>Fecha</label>
                        <input type="date" className="form-control" name="fecha" value={utv.fecha} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-4">
                        <label>Nombre Pauta</label>
                        <input type="text" className="form-control" name="nombre_pauta" value={utv.nombre_pauta} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-4">
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

                    {/* Grupo de ventanas */}
                    <div className="col-md-3">
                        <label>Doble Corredera</label>
                        <input type="number" className="form-control" name="doble_corredera" value={utv.doble_corredera} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-3">
                        <label>Proyectante</label>
                        <input type="number" className="form-control" name="proyectante" value={utv.proyectante} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-3">
                        <label>Fijo</label>
                        <input type="number" className="form-control" name="fijo" value={utv.fijo} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-3">
                        <label>Oscilobatiente</label>
                        <input type="number" className="form-control" name="oscilobatiente" value={utv.oscilobatiente} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-3">
                        <label>Doble corredera + fijo</label>
                        <input type="number" className="form-control" name="doble_corredera_fijo" value={utv.doble_corredera_fijo} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-3">
                        <label>Marco Puerta</label>
                        <input type="number" className="form-control" name="marco_puerta" value={utv.marco_puerta} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-3">
                        <label>Marco Adicionales</label>
                        <input type="number" className="form-control" name="marco_adicionales" value={utv.marco_adicionales} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-3">
                        <label>Otro</label>
                        <input type="number" className="form-control" name="otro" value={utv.otro} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-6">
                        <label>Obs. Marcos</label>
                        <input type="text" className="form-control" name="observacion_marcos" value={utv.observacion_marcos} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-6">
                        <label>Obs. Otro</label>
                        <input type="text" className="form-control" name="observacion_otro" value={utv.observacion_otro} onChange={e => handleChange(e, setUTV)} />
                    </div>
                    <div className="col-md-4">
                        <label>Valor m²</label>
                        <input type="number" className="form-control" name="valor_m2" value={utv.valor_m2} onChange={e => handleChange(e, setUTV)} />
                    </div>

                    <div className="col-md-12 text-end mt-3">
                        <button className="btn btn-success" onClick={registrarUTV}>Guardar UTV</button>
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
                        <input type="number" name="m2" className="form-control" value={termopanel.m2} onChange={(e) => handleChange(e, setTermopanel)} />
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


        {/* Instalación */}
        <div className="accordion my-3" id="accordionInstalacion">
            <div className="accordion-item">
                <h2 className="accordion-header" id="headingInstalacion">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseInstalacion" aria-expanded="false" aria-controls="collapseInstalacion">
                    Registrar Instalación
                </button>
                </h2>
                <div id="collapseInstalacion" className="accordion-collapse collapse" aria-labelledby="headingInstalacion" data-bs-parent="#accordionInstalacion">
                <div className="accordion-body">
                    <div className="row g-2">
                    <div className="col-md-4">
                        <label>Fecha</label>
                        <input type="date" name="fecha" className="form-control" value={instalacion.fecha} onChange={(e) => handleChange(e, setInstalacion)} />
                    </div>
                    <div className="col-md-4">
                        <label>Cliente</label>
                        <input type="text" name="nombre_cliente" className="form-control" value={instalacion.nombre_cliente} onChange={(e) => handleChange(e, setInstalacion)} />
                    </div>
                    <div className="col-md-4">
                        <label>m² Rectificación</label>
                        <input type="number" name="m2_rectificacion" className="form-control" value={instalacion.m2_rectificacion} onChange={(e) => handleChange(e, setInstalacion)} />
                    </div>
                    <div className="col-md-12">
                        <label>Observación</label>
                        <input type="text" name="observacion" className="form-control" value={instalacion.observacion} onChange={(e) => handleChange(e, setInstalacion)} />
                    </div>
                    <div className="col-md-3">
                        <label>Valor m²</label>
                        <input type="number" name="valor_m2" className="form-control" value={instalacion.valor_m2} onChange={(e) => handleChange(e, setInstalacion)} />
                    </div>
                    <div className="col-md-12 text-end mt-3">
                        <button className="btn btn-success" onClick={registrarInstalacion}>Guardar Instalación</button>
                    </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
        </div>

    {utvData.length > 0 && (
    <>
        <h4 className="mt-4">Último Registro Ingresado</h4>
        <table className="table table-sm table-bordered">
        <thead className="table-light">
            <tr>
            <th>Fecha</th>
            <th>Nombre Pauta</th>
            <th>Tipo</th>
            <th>Suma UTV</th>
            </tr>
        </thead>
        <tbody>
            <tr>
            <td>{utvData[utvData.length - 1].fecha}</td>
            <td>{utvData[utvData.length - 1].nombre_pauta}</td>
            <td>{utvData[utvData.length - 1].tipo}</td>
            <td>{calcularUTV(utvData[utvData.length - 1])}</td>
            </tr>
        </tbody>
        </table>
    </>
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
            <td>
                {utvData.reduce((acc, item) =>
                acc + item.doble_corredera + item.proyectante + item.fijo +
                item.oscilobatiente + item.doble_corredera_fijo + item.marco_puerta +
                item.marcos_adicionales + item.otro, 0)}
            </td>
            <td>
                {utvData.reduce((acc, item) => acc + calcularUTV(item), 0)}
            </td>
            <td>${totalUTV.toLocaleString('es-CL')}</td>
            </tr>
            <tr>
            <td>Termopanel</td>
            <td>{termopanelData.reduce((acc, item) => acc + item.m2, 0)}</td>
            <td>-</td>
            <td>${totalTermopanel.toLocaleString('es-CL')}</td>
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

  );
};

export default SeguimientoUTVPage;
