import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET: Todos los pagos con opcionales filtros por cliente o presupuesto
router.get('/', async (req, res) => {
  const { cliente_id, presupuesto_id } = req.query;
  let query = 'SELECT * FROM pagos_clientes WHERE 1=1';
  const params = [];

  if (cliente_id) {
    params.push(cliente_id);
    query += ` AND cliente_id = $${params.length}`;
  }

  if (presupuesto_id) {
    params.push(presupuesto_id);
    query += ` AND presupuesto_id = $${params.length}`;
  }

  query += ' ORDER BY fecha_pago DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener pagos:', err);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
});

// POST: Registrar nuevo pago
router.post('/', async (req, res) => {
  const { cliente_id, presupuesto_id, fecha_pago, monto, estado, observacion } = req.body;

  try {
    await pool.query(
      `INSERT INTO pagos_clientes (cliente_id, presupuesto_id, fecha_pago, monto, estado, observacion)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [cliente_id, presupuesto_id, fecha_pago, monto, estado, observacion]
    );
    res.status(201).json({ message: 'Pago registrado correctamente' });
  } catch (err) {
    console.error('Error al registrar pago:', err);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

export default router;
