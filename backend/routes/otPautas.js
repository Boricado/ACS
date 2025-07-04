import express from 'express';
const router = express.Router();
import pool from '../db.js'; // Asegúrate de que esté bien importado

// Categorías válidas
const categorias = [
  'perfiles', 'refuerzos', 'herraje', 'accesorios',
  'gomascepillos', 'tornillos', 'vidrio', 'instalacion'
];

// Middleware de validación de categoría
const validarCategoria = (req, res, next) => {
  const { categoria } = req.params;
  if (!categorias.includes(categoria.toLowerCase())) {
    return res.status(400).json({ error: 'Categoría no válida' });
  }
  req.tabla = `ot_pautas_${categoria.toLowerCase()}`;
  next();
};

// 📥 POST: Insertar en tabla dinámica
router.post('/:categoria', validarCategoria, async (req, res) => {
  const { cliente_id, presupuesto_id, codigo, producto, cantidad } = req.body;
  const tabla = req.tabla;
  try {
    await pool.query(`
      INSERT INTO ${tabla} (cliente_id, presupuesto_id, codigo, producto, cantidad)
      VALUES ($1, $2, $3, $4, $5)
    `, [cliente_id, presupuesto_id, codigo, producto, cantidad]);
    res.status(201).json({ message: 'Dato insertado' });
  } catch (err) {
    console.error('❌ Error insertando pauta:', err.message);
    res.status(500).json({ error: 'Error al guardar pauta' });
  }
});

// 📤 GET: Obtener pautas por cliente/presupuesto
router.get('/:categoria', validarCategoria, async (req, res) => {
  const { cliente_id, presupuesto_id } = req.query;
  const tabla = req.tabla;
  try {
    const result = await pool.query(`
      SELECT * FROM ${tabla}
      WHERE cliente_id = $1 AND presupuesto_id = $2
      ORDER BY id ASC
    `, [cliente_id, presupuesto_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error obteniendo pauta:', err.message);
    res.status(500).json({ error: 'Error al obtener pauta' });
  }
});

// 🔄 PUT: Actualizar cantidad
router.put('/:categoria/:id', validarCategoria, async (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;
  const tabla = req.tabla;
  try {
    await pool.query(`
      UPDATE ${tabla} SET cantidad = $1 WHERE id = $2
    `, [cantidad, id]);
    res.json({ message: 'Cantidad actualizada' });
  } catch (err) {
    console.error('❌ Error actualizando pauta:', err.message);
    res.status(500).json({ error: 'Error al actualizar pauta' });
  }
});

export default router;
