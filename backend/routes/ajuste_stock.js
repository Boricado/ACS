import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { codigo, producto, diferencia } = req.body;

  if (!codigo || !producto || !diferencia) {
    return res.status(400).json({ error: 'Faltan datos para el ajuste' });
  }

  try {
    const cantidad = Math.abs(parseInt(diferencia));
    const hoy = new Date();
    const fecha = hoy.toISOString().split('T')[0];
    const comentario = `Ajuste de stock ${fecha.split('-').reverse().join('-')}`;

    await pool.query(`
      INSERT INTO salidas_inventario2 (
        cliente_nombre,
        presupuesto_numero,
        nombre_obra,
        codigo,
        producto,
        cantidad,
        precio_neto,
        fecha,
        comentario
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
    `, [
      'ALUMCE - Stock',
      '1111',
      'Obra 1',
      codigo,
      producto,
      cantidad,
      fecha,
      comentario
    ]);

    res.status(200).json({ mensaje: 'Ajuste registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar ajuste:', error.message);
    res.status(500).json({ error: 'Error interno al registrar ajuste' });
  }
});

export default router;
