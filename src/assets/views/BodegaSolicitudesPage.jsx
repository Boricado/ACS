import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BodegaSolicitudesPage = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroPendientes, setFiltroPendientes] = useState(true);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/solicitudes');
      setSolicitudes(res.data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
    }
  };

  const handleAprobar = async (id, nuevoEstado) => {
    try {
      await axios.put(`http://localhost:4000/api/solicitudes/${id}`, {
        aprobada: nuevoEstado
      });
      fetchSolicitudes();
    } catch (err) {
      console.error("Error al actualizar solicitud:", err);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  const solicitudesFiltradas = solicitudes.filter(s =>
    !filtroPendientes || s.estado !== 'Aprobado'
  );

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Solicitudes a Bodega</h2>

      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="filtroPendientes"
          checked={filtroPendientes}
          onChange={() => setFiltroPendientes(!filtroPendientes)}
        />
        <label className="form-check-label" htmlFor="filtroPendientes">
          Ver solo pendientes
        </label>
      </div>

      <table className="table table-bordered table-hover table-sm text-center">
        <thead className="table-dark">
          <tr>
            <th>Material</th>
            <th>Cantidad</th>
            <th>Estado</th>
            <th>Fecha solicitud</th>
            <th>Solicitante</th>
            <th>Fecha aprobación</th>
            <th>Aprobar</th>
          </tr>
        </thead>
        <tbody>
          {solicitudesFiltradas.map((item, index) => (
            <tr key={index} className={item.estado === 'Aprobado' ? 'table-success' : ''}>
              <td>{item.producto || item.codigo}</td>
              <td>{item.cantidad}</td>
              <td>{item.estado}</td>
              <td>{formatearFecha(item.fecha_creacion)}</td>
              <td>{item.solicitante}</td>
              <td>{formatearFecha(item.fecha_aprobacion)}</td>
              <td>
                <input
                  type="checkbox"
                  checked={item.estado === 'Aprobado'}
                  onChange={() => handleAprobar(item.id, item.estado !== 'Aprobado')}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BodegaSolicitudesPage;
