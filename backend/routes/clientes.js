import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.post('/api/clientes', async (req, res) => {
  const { nombre, rut, correo, telefono, direccion } = req.body;

  try {
    await pool.query(
      'INSERT INTO clientes (nombre, rut, correo, telefono, direccion) VALUES ($1, $2, $3, $4, $5)',
      [nombre, rut, correo, telefono, direccion]
    );
    res.status(201).json({ mensaje: 'Cliente guardado correctamente' });
  } catch (error) {
    console.error('Error al guardar cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
