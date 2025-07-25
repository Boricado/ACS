import express from 'express';
import pool from '../db.js';

const router = express.Router();

// PUT /api/seguimiento_obras/:id/rectificacion
router.put('/:id/rectificacion', async (req, res) => {
  const { id } = req.params;
  const { rectificacion, rectificacion_plazo_dias } = req.body;

  const nuevaFecha = rectificacion ? new Date().toISOString().split('T')[0] : null;

  try {
    await pool.query(
      `UPDATE seguimiento_obras
       SET rectificacion = $1,
           rectificacion_fecha = $2,
           rectificacion_plazo_dias = $3
       WHERE id = $4`,
      [rectificacion, nuevaFecha, rectificacion_plazo_dias, id]
    );
    res.status(200).json({ mensaje: 'Rectificación actualizada' });
  } catch (err) {
    console.error('Error al actualizar rectificación:', err);
    res.status(500).json({ error: 'Error al actualizar rectificación' });
  }
});

// PUT /api/seguimiento_obras/:id/comentario
router.put('/:id/comentario', async (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;

  try {
    await pool.query(
      `UPDATE seguimiento_obras
       SET comentario = $1,
           comentario_fecha = NOW()
       WHERE id = $2`,
      [comentario, id]
    );
    res.status(200).json({ mensaje: 'Comentario actualizado' });
  } catch (err) {
    console.error('Error al guardar comentario:', err);
    res.status(500).json({ error: 'Error al guardar comentario' });
  }
});

// ✅ RUTA UNIFICADA: PUT /api/seguimiento_obras/:id/toggle
router.put('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { campo } = req.body;

  if (!campo) {
    return res.status(400).json({ error: 'Campo no proporcionado' });
  }

  // Lista blanca unificada con todos los campos posibles a toggle
  const camposPermitidos = [
    'perfiles', 'refuerzos', 'tornillos', 'herraje',
    'accesorios', 'gomas_cepillos', 'vidrio', 'instalacion',
    'planilla_corte', 'fabricacion', 'acopio', 'despacho',
    'recepcion_final', 'pago'
  ];

  if (!camposPermitidos.includes(campo)) {
    return res.status(400).json({ error: 'Campo no permitido' });
  }

  try {
    const result = await pool.query(
      `UPDATE seguimiento_obras
       SET ${campo} = NOT COALESCE(${campo}, false)
       WHERE id = $1
       RETURNING ${campo}`,
      [id]
    );
    res.json({ mensaje: `Campo ${campo} actualizado`, nuevoValor: result.rows[0][campo] });
  } catch (err) {
    console.error('Error al hacer toggle:', err);
    res.status(500).json({ error: 'Error al actualizar etapa' });
  }
});

export default router;
