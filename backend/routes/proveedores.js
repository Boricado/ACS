import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Obtener todos los proveedores
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proveedores ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

// Crear un nuevo proveedor
router.post('/', async (req, res) => {
  const { nombre, rut, correo, telefono, direccion } = req.body;
  try {
    await pool.query(
      'INSERT INTO proveedores (nombre, rut, correo, telefono, direccion) VALUES ($1, $2, $3, $4, $5)',
      [nombre, rut, correo, telefono, direccion]
    );
    res.status(201).json({ mensaje: 'Proveedor creado correctamente' });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

// Editar proveedor existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, rut, correo, telefono, direccion } = req.body;
  try {
    await pool.query(
      'UPDATE proveedores SET nombre = $1, rut = $2, correo = $3, telefono = $4, direccion = $5 WHERE id = $6',
      [nombre, rut, correo, telefono, direccion, id]
    );
    res.json({ mensaje: 'Proveedor actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

export default router;
