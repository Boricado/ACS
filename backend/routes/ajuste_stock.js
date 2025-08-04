import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { codigo, producto, diferencia } = req.body;

  if (!codigo || !producto || diferencia === undefined) {
    return res.status(400).json({ error: 'Faltan datos para el ajuste' });
  }

  try {
    const cantidad = parseInt(diferencia);
    const hoy = new Date();
    const fecha = hoy.toISOString().split('T')[0];
    const comentario = `Ajuste de stock ${fecha.split('-').reverse().join('-')}`;

    // 1. Insertar en historial
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
      Math.abs(cantidad),
      fecha,
      comentario
    ]);

    // 2. Obtener stock actual
    const result = await pool.query('SELECT stock_actual FROM inventario WHERE codigo = $1', [codigo]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const stockAnterior = parseInt(result.rows[0].stock_actual);
    const nuevoStock = stockAnterior + cantidad; // suma si diferencia es positiva, resta si negativa

    // 3. Actualizar inventario
    await pool.query(`
      UPDATE inventario
      SET stock_actual = $1
      WHERE codigo = $2
    `, [nuevoStock, codigo]);

    res.status(200).json({ mensaje: 'Ajuste aplicado correctamente' });
  } catch (error) {
    console.error('❌ Error al registrar ajuste:', error.message);
    res.status(500).json({ error: 'Error interno al registrar ajuste' });
  }
});

export default router;
