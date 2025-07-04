import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/SeguimientoObrasPage.css'; // opcional para estilos personalizados

const SeguimientoObrasPage = () => {
  const [obras, setObras] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [comentarios, setComentarios] = useState({});

  useEffect(() => {
    cargarObras();
  }, []);

  const cargarObras = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/seguimiento_obras');
      setObras(res.data);
    } catch (err) {
      console.error('Error al cargar seguimiento de obras:', err);
    }
  };

  const handleComentarioChange = (id, texto) => {
    setComentarios({ ...comentarios, [id]: texto });
  };

  const guardarComentario = async (id) => {
    try {
      await axios.put(`http://localhost:4000/api/seguimiento_obras/${id}/comentario`, {
        comentario: comentarios[id]
      });
      alert('Comentario guardado');
    } catch (error) {
      console.error('Error al guardar comentario:', error);
      alert('Error al guardar comentario');
    }
  };

  const renderCheck = (estado) => (
    <span style={{ color: estado ? 'green' : 'black' }}>
      ● {estado ? 'Completado' : 'Pendiente'}
    </span>
  );

  const obrasFiltradas = obras.filter(o =>
    o.cliente_nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    o.presupuesto_numero.toString().includes(filtro) ||
    o.nombre_obra.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Seguimiento de Obras</h2>

      <input
        type="text"
        className="form-control mb-4"
        placeholder="Buscar por cliente, presupuesto o nombre de obra"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      {obrasFiltradas.map((obra) => (
        <div key={obra.id} className="border p-3 mb-3 rounded">
          <h5>{obra.cliente_nombre} - {obra.presupuesto_numero} - {obra.nombre_obra}</h5>

          <ul>
            <li>{renderCheck(obra.presupuesto)} Presupuesto</li>
            <li>{renderCheck(obra.rectificación)} Rectificación</li>
            <li>Material
              <ul>
                <li>{renderCheck(obra.perfiles)} Perfiles</li>
                <li>{renderCheck(obra.refuerzos)} Refuerzos</li>
                <li>{renderCheck(obra.herraje)} Herrajes</li>
                <li>{renderCheck(obra.tornillos)} Tornillos</li>
                <li>{renderCheck(obra.accesorios)} Accesorios</li>
                <li>{renderCheck(obra.gomas_cepillos)} Gomas y Cepillos</li>
                <li>{renderCheck(obra.vidrio)} Vidrios</li>
                <li>{renderCheck(obra.instalacion)} Material Instalación</li>
              </ul>
            </li>
            <li>{renderCheck(obra.planilla_corte)} Planilla de Corte</li>
            <li>{renderCheck(obra.fabricación)} Fabricación</li>
            <li>{renderCheck(obra.acopio)} Acopio</li>
            <li>{renderCheck(obra.despacho)} Despacho</li>
            <li>{renderCheck(obra.instalacion_final)} Instalación</li>
            <li>{renderCheck(obra.recepcion_final)} Recepción Final</li>
            <li>{renderCheck(obra.pago)} Pago</li>
          </ul>

          <div className="mb-2">
            <label>Comentario:</label>
            <textarea
              className="form-control"
              rows="2"
              value={comentarios[obra.id] ?? obra.comentario ?? ''}
              onChange={(e) => handleComentarioChange(obra.id, e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => guardarComentario(obra.id)}
          >
            Guardar comentario
          </button>
        </div>
      ))}
    </div>
  );
};

export default SeguimientoObrasPage;
