import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SeguimientoUTVPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const [fechaActual, setFechaActual] = useState(new Date());
  const [utv, setUTV] = useState({
    fecha: '',
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
    valor_m2: 3000
  });
  const [termopanel, setTermopanel] = useState({
    fecha: '',
    nombre_cliente: '',
    cantidad: 0,
    ancho: 0,
    alto: 0,
    m2: 0,
    observacion: '',
    valor_m2: 1500
  });
  const [instalacion, setInstalacion] = useState({
    fecha: '',
    nombre_cliente: '',
    m2_rectificacion: 0,
    observacion: '',
    valor_m2: 3000
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

  const registrarUTV = async () => {
    await axios.post(`${API}api/seguimiento_utv`, utv);
    obtenerDatos();
  };

  const registrarTermopanel = async () => {
    await axios.post(`${API}api/seguimiento_termopanel`, termopanel);
    obtenerDatos();
  };

  const registrarInstalacion = async () => {
    await axios.post(`${API}api/seguimiento_instalaciones`, instalacion);
    obtenerDatos();
  };

  const obtenerDatos = async () => {
    const params = { mes: mesFiltro, anio: anioFiltro };
    const [utvRes, termoRes, instRes] = await Promise.all([
      axios.get(`${API}api/seguimiento_utv`, { params }),
      axios.get(`${API}api/seguimiento_termopanel`, { params }),
      axios.get(`${API}api/seguimiento_instalaciones`, { params })
    ]);
    setUtvData(utvRes.data);
    setTermopanelData(termoRes.data);
    setInstalacionData(instRes.data);
  };

  useEffect(() => {
    obtenerDatos();
  }, [mesFiltro, anioFiltro]);

  const totalUTV = utvData.reduce((acc, item) => {
    const totalCant = item.doble_corredera + item.proyectante + item.fijo + item.oscilobatiente + item.doble_corredera_fijo + item.marco_puerta + item.marco_adicionales + item.otro;
    return acc + totalCant * item.valor_m2;
  }, 0);

  const totalTermopanel = termopanelData.reduce((acc, item) => acc + item.m2 * item.valor_m2, 0);
  const totalInstalacion = instalacionData.reduce((acc, item) => acc + item.m2_rectificacion * item.valor_m2, 0);

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

      <div className="row">
        <div className="col">
          <h5>Registrar UTV</h5>
          <button className="btn btn-sm btn-primary mb-2" onClick={registrarUTV}>Registrar UTV</button>
        </div>
        <div className="col">
          <h5>Registrar Termopanel</h5>
          <button className="btn btn-sm btn-primary mb-2" onClick={registrarTermopanel}>Registrar Termopanel</button>
        </div>
        <div className="col">
          <h5>Registrar Instalación</h5>
          <button className="btn btn-sm btn-primary mb-2" onClick={registrarInstalacion}>Registrar Instalación</button>
        </div>
      </div>

      <h4 className="mt-4">Resumen</h4>
      <table className="table table-bordered mt-3">
        <thead className="table-light">
          <tr>
            <th>Sección</th>
            <th>Cantidad / m²</th>
            <th>Valor Acumulado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>UTV</td>
            <td>{utvData.reduce((acc, item) => acc + item.doble_corredera + item.proyectante + item.fijo + item.oscilobatiente + item.doble_corredera_fijo + item.marco_puerta + item.marco_adicionales + item.otro, 0)}</td>
            <td>${totalUTV.toLocaleString('es-CL')}</td>
          </tr>
          <tr>
            <td>Termopanel</td>
            <td>{termopanelData.reduce((acc, item) => acc + item.m2, 0)}</td>
            <td>${totalTermopanel.toLocaleString('es-CL')}</td>
          </tr>
          <tr>
            <td>Instalación</td>
            <td>{instalacionData.reduce((acc, item) => acc + item.m2_rectificacion, 0)}</td>
            <td>${totalInstalacion.toLocaleString('es-CL')}</td>
          </tr>
          <tr className="fw-bold">
            <td>Total a Pagar</td>
            <td colSpan={2}>${(totalUTV + totalTermopanel + totalInstalacion).toLocaleString('es-CL')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SeguimientoUTVPage;
