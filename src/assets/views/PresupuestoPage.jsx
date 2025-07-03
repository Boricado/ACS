import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PresupuestoPage = () => {
  const [clientes, setClientes] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  const [presupuesto, setPresupuesto] = useState({
    numero: '',
    cliente_id: '',
    nombre_obra: '',
    direccion: '',
    observacion: '',
    fecha: ''
  });

  // Cargar clientes al montar el componente
  useEffect(() => {
    axios.get('http://localhost:4000/api/clientes')
      .then(res => setClientes(res.data))
      .catch(err => {
        console.error('Error al cargar clientes:', err);
        setClientes([]);
      });
  }, []);

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPresupuesto(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enviar presupuesto al backend
  const guardarPresupuesto = async () => {
    try {
      await axios.post('http://localhost:4000/api/presupuestos', presupuesto);
      setMensaje({ tipo: 'success', texto: 'Presupuesto guardado correctamente' });
      setPresupuesto({
        numero: '',
        cliente_id: '',
        nombre_obra: '',
        direccion: '',
        observacion: '',
        fecha: ''
      });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al guardar presupuesto' });
    }
  };

  return (
    <div className="container mt-4">
      <h3>Nuevo Presupuesto</h3>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo === 'error' ? 'danger' : 'success'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="row">
        {/* Selector de cliente */}
        <div className="col-md-6 mb-3">
          <select
            name="cliente_id"
            className="form-select"
            value={presupuesto.cliente_id}
            onChange={handleChange}
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} - {cliente.rut}
              </option>
            ))}
          </select>
        </div>

        {/* Número de presupuesto */}
        <div className="col-md-6 mb-3">
          <input
            name="numero"
            className="form-control"
            placeholder="Número Presupuesto"
            value={presupuesto.numero}
            onChange={handleChange}
          />
        </div>

        {/* Nombre de la obra */}
        <div className="col-md-6 mb-3">
          <input
            name="nombre_obra"
            className="form-control"
            placeholder="Nombre de la Obra"
            value={presupuesto.nombre_obra}
            onChange={handleChange}
          />
        </div>

        {/* Dirección */}
        <div className="col-md-6 mb-3">
          <input
            name="direccion"
            className="form-control"
            placeholder="Dirección"
            value={presupuesto.direccion}
            onChange={handleChange}
          />
        </div>

        {/* Observaciones */}
        <div className="col-12 mb-3">
          <textarea
            name="observacion"
            className="form-control"
            placeholder="Observaciones"
            value={presupuesto.observacion}
            onChange={handleChange}
          />
        </div>

        {/* Botón de guardar */}
        <div className="col-12">
          <button className="btn btn-primary" onClick={guardarPresupuesto}>
            Guardar Presupuesto
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresupuestoPage;
