// backend/routes/salidas.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Ruta para obtener histórico de salidas
router.get('/salidas_inventario2', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM salidas_inventario2 ORDER BY fecha DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener salidas:', error);
    res.status(500).json({ error: 'Error al obtener salidas' });
  }
});

// Ruta para registrar nueva salida
router.post('/registro_salida', async (req, res) => {
  const {
    codigo,
    producto,
    cantidad_salida,
    cliente_id,
    presupuesto_id,
    cliente_nombre,
    presupuesto_numero,
    nombre_obra,
    observacion
  } = req.body;

  try {
    // Registrar la salida
const query = `
  INSERT INTO salidas_inventario2
  (codigo, producto, cantidad, cliente_nombre, presupuesto_numero, nombre_obra, fecha, comentario)
  VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)
`;

await pool.query(query, [
  codigo,
  producto,
  cantidad_salida,
  cliente_nombre,
  presupuesto_numero,
  nombre_obra,
  observacion?.trim() || ''
]);
    // Descontar del inventario
    await pool.query(`
      UPDATE inventario
      SET stock_actual = stock_actual - $1
      WHERE codigo = $2
    `, [cantidad_salida, codigo]);

    res.json({ message: 'Salida registrada exitosamente' });
  } catch (error) {
    console.error('Error al registrar salida:', error);
    res.status(500).json({ error: 'Error al registrar salida' });
  }
});


export default router;
