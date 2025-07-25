import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PagosClientesPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [form, setForm] = useState({
    cliente_id: '',
    presupuesto_id: '',
    fecha_pago: '',
    monto: '',
    estado: '',
    observacion: ''
  });

  const [resumen, setResumen] = useState({ neto: 0, total: 0, pagado: 0, saldo: 0, estado: '' });

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (form.cliente_id) cargarPresupuestos(form.cliente_id);
  }, [form.cliente_id]);

  useEffect(() => {
    if (form.presupuesto_id) cargarPagos(form.presupuesto_id);
  }, [form.presupuesto_id]);

  const cargarClientes = async () => {
    const res = await axios.get(`${API}api/clientes`);
    setClientes(res.data);
  };

  const cargarPresupuestos = async (cliente_id) => {
    const res = await axios.get(`${API}api/presupuestos`);
    const filtrados = res.data.filter(p => p.cliente_id == cliente_id);
    setPresupuestos(filtrados);
  };

  const cargarPagos = async (presupuesto_id) => {
    const res = await axios.get(`${API}api/pagos_clientes`, { params: { presupuesto_id } });
    setPagos(res.data);

    const presupuesto = presupuestos.find(p => p.id == presupuesto_id);
    const neto = presupuesto?.total_neto_presupuestado || 0;
    const total = Math.round(neto * 1.19);
    const pagado = res.data.reduce((sum, p) => sum + Number(p.monto), 0);
    const saldo = total - pagado;

    let estadoPago = 'Pendiente';
    if (saldo <= 0) estadoPago = 'Pagado';
    else if (pagado > 0) estadoPago = 'Parcial';

    setResumen({ neto, total, pagado, saldo, estado: estadoPago });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const guardarPago = async () => {
    try {
      await axios.post(`${API}api/pagos_clientes`, form);
      alert('Pago registrado');
      setForm({ ...form, fecha_pago: '', monto: '', estado: '', observacion: '' });
      cargarPagos(form.presupuesto_id);
    } catch (err) {
      console.error('Error al guardar pago:', err);
      alert('Error al guardar');
    }
  };

  return (
    <div className="container py-4">
      <h3>Registro de Pagos de Clientes</h3>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label>Cliente</label>
          <select className="form-control" name="cliente_id" value={form.cliente_id} onChange={handleChange}>
            <option value="">Seleccione</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label>Presupuesto</label>
          <select className="form-control" name="presupuesto_id" value={form.presupuesto_id} onChange={handleChange}>
            <option value="">Seleccione</option>
            {presupuestos.map(p => (
              <option key={p.id} value={p.id}>{p.numero} - {p.nombre_obra}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-2">
          <label>Fecha</label>
          <input type="date" name="fecha_pago" className="form-control" value={form.fecha_pago} onChange={handleChange} />
        </div>
        <div className="col-md-2">
          <label>Monto (con IVA)</label>
          <input type="number" name="monto" className="form-control" value={form.monto} onChange={handleChange} />
        </div>
        <div className="col-md-2">
          <label>Estado</label>
          <select className="form-control" name="estado" value={form.estado} onChange={handleChange}>
            <option value="">Seleccione</option>
            <option value="Pagado">Pagado</option>
            <option value="Parcial">Parcial</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
        <div className="col-md-6">
          <label>Observación</label>
          <input type="text" name="observacion" className="form-control" value={form.observacion} onChange={handleChange} />
        </div>
      </div>

      <button className="btn btn-primary mb-3" onClick={guardarPago}>Guardar Pago</button>

      <h5>Resumen</h5>
      <ul>
        <li>Total Neto: ${resumen.neto.toLocaleString()}</li>
        <li>Total con IVA: ${resumen.total.toLocaleString()}</li>
        <li>Pagado: ${resumen.pagado.toLocaleString()}</li>
        <li>Saldo: ${resumen.saldo.toLocaleString()}</li>
        <li>Estado: <strong>{resumen.estado}</strong></li>
      </ul>

      <h5>Pagos Registrados</h5>
      <table className="table table-bordered table-sm text-center">
        <thead className="table-dark">
          <tr>
            <th>Fecha</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Observación</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((p, i) => (
            <tr key={i}>
              <td>{p.fecha_pago}</td>
              <td>${Number(p.monto).toLocaleString()}</td>
              <td>{p.estado}</td>
              <td>{p.observacion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PagosClientesPage;
