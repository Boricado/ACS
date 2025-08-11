import express from 'express';
import pg from 'pg';
const router = express.Router();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET /api/trabajadores
router.get('/trabajadores', async (req, res) => {
  const { periodo } = req.query;
  let q = `SELECT id, periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab
           FROM trabajadores`;
  const vals = [];
  if (periodo) { q += ` WHERE periodo = $1`; vals.push(periodo); }
  q += ` ORDER BY id ASC`;
  const r = await pool.query(q, vals);
  res.json(r.rows);
});

// POST /api/trabajadores
router.post('/trabajadores', async (req, res) => {
  const { periodo, nombre, dias_trab=0, horas_trab=0, horas_extras=0, horas_retraso=0, observacion='', horas_acum_trab=0 } = req.body;
  const r = await pool.query(
    `INSERT INTO trabajadores (periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab`,
    [periodo || new Date().toISOString().slice(0,7), nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab]
  );
  res.status(201).json(r.rows[0]);
});

// PUT /api/trabajadores/:id
router.put('/trabajadores/:id', async (req, res) => {
  const { id } = req.params;
  const { periodo, nombre, dias_trab=0, horas_trab=0, horas_extras=0, horas_retraso=0, observacion='', horas_acum_trab=0 } = req.body;
  const r = await pool.query(
    `UPDATE trabajadores
     SET periodo=$1, nombre=$2, dias_trab=$3, horas_trab=$4, horas_extras=$5, horas_retraso=$6, observacion=$7, horas_acum_trab=$8
     WHERE id=$9
     RETURNING id, periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab`,
    [periodo || new Date().toISOString().slice(0,7), nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab, id]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
  res.json(r.rows[0]);
});

// DELETE /api/trabajadores/:id
router.delete('/trabajadores/:id', async (req, res) => {
  const { id } = req.params;
  const r = await pool.query('DELETE FROM trabajadores WHERE id=$1', [id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
  res.json({ message: 'Trabajador eliminado' });
});

export default router;
