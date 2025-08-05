import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Ruta para registrar un ajuste manual de stock
router.post('/', async (req, res) => {
  const { codigo, producto, diferencia } = req.body;

  if (!codigo || !producto || diferencia === undefined) {
    return res.status(400).json({ error: 'Faltan datos para el ajuste' });
  }

  try {
    const cantidad = parseInt(diferencia);
    if (isNaN(cantidad)) {
      return res.status(400).json({ error: 'Diferencia no válida' });
    }

    const hoy = new Date();
    const fecha = hoy.toISOString().split('T')[0]; // formato YYYY-MM-DD
    const fechaAjusteTexto = fecha.split('-').reverse().join('-'); // formato DD-MM-YYYY
    const diferenciaInvertida = -cantidad; // Para que respete la lógica de salidas
    const comentarioAjuste = `Ajuste ${fechaAjusteTexto}`;

    // 1. Insertar en historial de salidas
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
        comentario_ajuste
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
    `, [
      'ALUMCE - Stock',
      'AJUSTE',
      'Ajuste de Inventario',
      codigo,
      producto,
      diferenciaInvertida,
      fecha,
      comentarioAjuste
    ]);

    // 2. Obtener stock actual
    const result = await pool.query(
      'SELECT stock_actual FROM inventario WHERE codigo = $1',
      [codigo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const stockAnterior = parseInt(result.rows[0].stock_actual);
    const nuevoStock = stockAnterior + cantidad;

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

// Ruta para obtener último ajuste por código
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT codigo, 
             MAX(fecha) AS fecha, 
             MAX(comentario_ajuste) AS comentario_ajuste
      FROM salidas_inventario2
      WHERE comentario_ajuste IS NOT NULL
      GROUP BY codigo
    `);

    const ajustes = {};
    result.rows.forEach(row => {
      ajustes[row.codigo] = {
        fecha: row.fecha,
        comentario: row.comentario_ajuste
      };
    });

    res.json(ajustes);
  } catch (error) {
    console.error('❌ Error al obtener ajustes:', error.message);
    res.status(500).json({ error: 'Error al obtener últimos ajustes' });
  }
});

export default router;
