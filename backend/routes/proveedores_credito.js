// backend/routes/proveedores_credito.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET: Listar proveedores con su campo dias_credito
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, dias_credito FROM proveedores`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener proveedores con días de crédito:', err);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

export default router;
