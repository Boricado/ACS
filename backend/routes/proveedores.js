import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET: Obtener todos los proveedores con campos renombrados para frontend
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        proveedor,
        rut,
        vendedor,
        contacto,
        banco,
        tipo_de_cuenta,
        numero_cuenta
      FROM proveedores
      ORDER BY proveedor
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

// POST: Crear un nuevo proveedor
router.post('/', async (req, res) => {
  const {
    proveedor,
    rut,
    vendedor,
    contacto,
    banco,
    tipo_de_cuenta,
    numero_cuenta
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO proveedores 
      (proveedor, rut, vendedor, contacto, banco, tipo_de_cuenta, numero_cuenta)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [proveedor, rut, vendedor, contacto, banco, tipo_de_cuenta, numero_cuenta]
    );
    res.status(201).json({ mensaje: 'Proveedor creado correctamente' });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

// PUT: Actualizar proveedor existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    proveedor,
    rut,
    vendedor,
    contacto,
    banco,
    tipo_de_cuenta,
    numero_cuenta
  } = req.body;

  try {
    await pool.query(
      `UPDATE proveedores SET
        proveedor = $1,
        rut = $2,
        vendedor = $3,
        contacto = $4,
        banco = $5,
        tipo_de_cuenta = $6,
        numero_cuenta = $7
      WHERE id = $8`,
      [proveedor, rut, vendedor, contacto, banco, tipo_de_cuenta, numero_cuenta, id]
    );
    res.json({ mensaje: 'Proveedor actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

export default router;
