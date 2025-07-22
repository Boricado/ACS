import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PresupuestoPage = () => {
  const [clientes, setClientes] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const API = import.meta.env.VITE_API_URL;

  const [presupuesto, setPresupuesto] = useState({
    numero: '',
    cliente_id: '',
    nombre_obra: '',
    direccion: '',
    observacion: '',
    fecha: '',
    total_neto_presupuestado: ''
  });

  // Cargar clientes al iniciar
  useEffect(() => {
    axios.get(`${API}api/clientes`)
      .then(res => setClientes(res.data))
      .catch(err => {
        console.error('Error al cargar clientes:', err);
        setClientes([]);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPresupuesto(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const guardarPresupuesto = async () => {
    const { numero, cliente_id, nombre_obra, direccion, observacion, fecha, total_neto_presupuestado } = presupuesto;

    if (!numero || !cliente_id || !nombre_obra) {
      setMensaje({ tipo: 'error', texto: 'Complete los campos obligatorios' });
      return;
    }

    try {
      // Validar duplicado
      const resValidacion = await axios.get(`${API}api/presupuestos/cliente/${cliente_id}`);
      const yaExiste = resValidacion.data.some(p => p.numero === numero);

      if (yaExiste) {
        setMensaje({ tipo: 'error', texto: 'Ya existe un presupuesto con ese número para este cliente' });
        return;
      }

      // Guardar presupuesto
      const res = await axios.post(`${API}api/presupuestos`, {
        numero,
        cliente_id,
        nombre_obra,
        direccion,
        observacion,
        fecha,
        total_neto_presupuestado: Number(total_neto_presupuestado) || 0
      });

      // Obtener nombre del cliente
      const clienteEncontrado = clientes.find(c => c.id.toString() === cliente_id);
      const cliente_nombre = clienteEncontrado?.nombre || 'Sin nombre';

      setMensaje({ tipo: 'success', texto: 'Presupuesto y seguimiento guardados correctamente' });

      setPresupuesto({
        numero: '',
        cliente_id: '',
        nombre_obra: '',
        direccion: '',
        observacion: '',
        fecha: '',
        total_neto_presupuestado: ''
      });

    } catch (err) {
      console.error('Error al guardar:', err.message);
      setMensaje({ tipo: 'error', texto: 'Error al guardar presupuesto o seguimiento' });
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

        <div className="col-md-6 mb-3">
          <input
            name="numero"
            className="form-control"
            placeholder="Número Presupuesto"
            value={presupuesto.numero}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6 mb-3">
          <input
            name="nombre_obra"
            className="form-control"
            placeholder="Nombre de la Obra"
            value={presupuesto.nombre_obra}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6 mb-3">
          <input
            name="direccion"
            className="form-control"
            placeholder="Dirección"
            value={presupuesto.direccion}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6 mb-3">
          <input
            name="total_neto_presupuestado"
            className="form-control"
            type="number"
            placeholder="Presupuestado Neto ($)"
            value={presupuesto.total_neto_presupuestado}
            onChange={handleChange}
          />
        </div>

        <div className="col-12 mb-3">
          <textarea
            name="observacion"
            className="form-control"
            placeholder="Observaciones"
            value={presupuesto.observacion}
            onChange={handleChange}
          />
        </div>

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
