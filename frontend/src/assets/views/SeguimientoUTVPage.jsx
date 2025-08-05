import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';

const SeguimientoUTVPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const [fechaActual, setFechaActual] = useState(new Date());
  const [utv, setUTV] = useState({
    fecha: '', nombre_pauta: '', numero_pauta: '', tipo: 'PVC',
    doble_corredera: 0, proyectante: 0, fijo: 0, oscilobatiente: 0,
    doble_corredera_fijo: 0, marco_puerta: 0, marco_adicionales: 0, otro: 0,
    observacion_marcos: '', observacion_otro: '', valor_m2: 3000
  });
  const [showModalUTV, setShowModalUTV] = useState(false);
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

  const registrarUTV = async () => {
    await axios.post(`${API}api/seguimiento_utv`, utv);
    obtenerDatos();
    setShowModalUTV(false);
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

      <h4 className="mt-4">Registrar Datos</h4>
      <div className="row">
        <div className="col-md-4">
          <h5>UTV</h5>
          <button className="btn btn-primary btn-sm mb-2" onClick={() => setShowModalUTV(true)}>Registrar UTV</button>
        </div>

        <div className="col-md-4">
          <h5>Termopanel</h5>
          <input type="date" name="fecha" className="form-control mb-1" value={termopanel.fecha} onChange={(e) => handleChange(e, setTermopanel)} />
          <input type="text" name="nombre_cliente" className="form-control mb-1" placeholder="Cliente" value={termopanel.nombre_cliente} onChange={(e) => handleChange(e, setTermopanel)} />
          <input type="number" name="cantidad" className="form-control mb-1" placeholder="Cantidad" value={termopanel.cantidad} onChange={(e) => handleChange(e, setTermopanel)} />
          <input type="number" name="ancho" className="form-control mb-1" placeholder="Ancho (mm)" value={termopanel.ancho} onChange={(e) => handleChange(e, setTermopanel)} />
          <input type="number" name="alto" className="form-control mb-1" placeholder="Alto (mm)" value={termopanel.alto} onChange={(e) => handleChange(e, setTermopanel)} />
          <input type="number" name="m2" className="form-control mb-1" placeholder="M2" value={termopanel.m2} onChange={(e) => handleChange(e, setTermopanel)} />
          <input type="text" name="observacion" className="form-control mb-1" placeholder="Observación" value={termopanel.observacion} onChange={(e) => handleChange(e, setTermopanel)} />
          <input type="number" name="valor_m2" className="form-control mb-1" placeholder="Valor m²" value={termopanel.valor_m2} onChange={(e) => handleChange(e, setTermopanel)} />
          <button className="btn btn-sm btn-primary mt-2" onClick={registrarTermopanel}>Registrar Termopanel</button>
        </div>

        <div className="col-md-4">
          <h5>Instalación</h5>
          <input type="date" name="fecha" className="form-control mb-1" value={instalacion.fecha} onChange={(e) => handleChange(e, setInstalacion)} />
          <input type="text" name="nombre_cliente" className="form-control mb-1" placeholder="Cliente" value={instalacion.nombre_cliente} onChange={(e) => handleChange(e, setInstalacion)} />
          <input type="number" name="m2_rectificacion" className="form-control mb-1" placeholder="m² rectificación" value={instalacion.m2_rectificacion} onChange={(e) => handleChange(e, setInstalacion)} />
          <input type="text" name="observacion" className="form-control mb-1" placeholder="Observación" value={instalacion.observacion} onChange={(e) => handleChange(e, setInstalacion)} />
          <input type="number" name="valor_m2" className="form-control mb-1" placeholder="Valor m²" value={instalacion.valor_m2} onChange={(e) => handleChange(e, setInstalacion)} />
          <button className="btn btn-sm btn-primary mt-2" onClick={registrarInstalacion}>Registrar Instalación</button>
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

      {/* Modal para formulario detallado de UTV */}
      <Modal show={showModalUTV} onHide={() => setShowModalUTV(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Formulario Detallado - UTV</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6">
              <input type="date" name="fecha" className="form-control mb-1" value={utv.fecha} onChange={(e) => handleChange(e, setUTV)} />
              <input type="text" name="nombre_pauta" className="form-control mb-1" placeholder="Nombre pauta" value={utv.nombre_pauta} onChange={(e) => handleChange(e, setUTV)} />
              <input type="text" name="numero_pauta" className="form-control mb-1" placeholder="N° pauta" value={utv.numero_pauta} onChange={(e) => handleChange(e, setUTV)} />
              <select name="tipo" className="form-select mb-1" value={utv.tipo} onChange={(e) => handleChange(e, setUTV)}>
                <option value="PVC">PVC</option>
                <option value="Aluminio">Aluminio</option>
                <option value="Ambos">Ambos</option>
              </select>
            </div>
            <div className="col-md-6">
              {["doble_corredera", "proyectante", "fijo", "oscilobatiente", "doble_corredera_fijo", "marco_puerta", "marco_adicionales", "otro"].map((key) => (
                <input key={key} type="number" name={key} className="form-control mb-1" placeholder={key.replaceAll("_", " ")} value={utv[key]} onChange={(e) => handleChange(e, setUTV)} />
              ))}
              <input type="text" name="observacion_marcos" className="form-control mb-1" placeholder="Obs. marcos" value={utv.observacion_marcos} onChange={(e) => handleChange(e, setUTV)} />
              <input type="text" name="observacion_otro" className="form-control mb-1" placeholder="Obs. otro" value={utv.observacion_otro} onChange={(e) => handleChange(e, setUTV)} />
              <input type="number" name="valor_m2" className="form-control mb-1" placeholder="Valor m²" value={utv.valor_m2} onChange={(e) => handleChange(e, setUTV)} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalUTV(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={registrarUTV}>
            Guardar UTV
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SeguimientoUTVPage;
