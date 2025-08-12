import express from 'express';
import pg from 'pg';
const router = express.Router();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const JORNADA_DIARIA = 9;

// Helpers numéricos
const nz = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v) || 0);
const nnp = (v) => Math.max(0, nz(v)); // non-negative

// GET /api/trabajadores?periodo=YYYY-MM
router.get('/trabajadores', async (req, res) => {
  try {
    const { periodo } = req.query;
    let q = `
      SELECT id, periodo, nombre,
             COALESCE(dias_trab,0)           AS dias_trab,
             COALESCE(horas_trab,0)          AS horas_trab,
             COALESCE(horas_extras,0)        AS horas_extras,
             COALESCE(horas_retraso,0)       AS horas_retraso,
             COALESCE(observacion,'')        AS observacion,
             COALESCE(horas_acum_trab,0)     AS horas_acum_trab
      FROM trabajadores
    `;
    const vals = [];
    if (periodo) { q += ` WHERE periodo = $1`; vals.push(periodo); }
    q += ` ORDER BY id ASC`;
    const r = await pool.query(q, vals);
    res.json(r.rows);
  } catch (err) {
    console.error('GET /trabajadores', err);
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
});

// POST /api/trabajadores
router.post('/trabajadores', async (req, res) => {
  try {
    const {
      periodo,
      nombre,
      dias_trab = 0,
      horas_extras = 0,
      horas_retraso = 0,
      observacion = ''
    } = req.body;

    const dias = nnp(dias_trab);
    const extras = nnp(horas_extras);
    const retraso = nnp(horas_retraso);

    const horas_trab = dias * JORNADA_DIARIA;
    const horas_acum_trab = Math.max(0, horas_trab + extras - retraso);

    const r = await pool.query(
      `INSERT INTO trabajadores
         (periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab`,
      [periodo || new Date().toISOString().slice(0,7), (nombre || '').trim(), dias, horas_trab, extras, retraso, observacion || '', horas_acum_trab]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('POST /trabajadores', err);
    res.status(500).json({ error: 'Error al crear trabajador' });
  }
});

// PUT /api/trabajadores/:id
router.put('/trabajadores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      periodo,
      nombre,
      dias_trab = 0,
      horas_extras = 0,
      horas_retraso = 0,
      observacion = ''
    } = req.body;

    const dias = nnp(dias_trab);
    const extras = nnp(horas_extras);
    const retraso = nnp(horas_retraso);

    const horas_trab = dias * JORNADA_DIARIA;
    const horas_acum_trab = Math.max(0, horas_trab + extras - retraso);

    const r = await pool.query(
      `UPDATE trabajadores
         SET periodo=$1,
             nombre=$2,
             dias_trab=$3,
             horas_trab=$4,
             horas_extras=$5,
             horas_retraso=$6,
             observacion=$7,
             horas_acum_trab=$8
       WHERE id=$9
       RETURNING id, periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab`,
      [periodo || new Date().toISOString().slice(0,7), (nombre || '').trim(), dias, horas_trab, extras, retraso, observacion || '', horas_acum_trab, id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('PUT /trabajadores/:id', err);
    res.status(500).json({ error: 'Error al actualizar trabajador' });
  }
});

// DELETE /api/trabajadores/:id
router.delete('/trabajadores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query('DELETE FROM trabajadores WHERE id=$1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json({ message: 'Trabajador eliminado' });
  } catch (err) {
    console.error('DELETE /trabajadores/:id', err);
    res.status(500).json({ error: 'Error al eliminar trabajador' });
  }
});

// POST /api/trabajadores/copiar?de=YYYY-MM&a=YYYY-MM
// Copia NOMBRES del mes "de" hacia el mes "a", con horas/días en 0 (listos para editar).
router.post('/trabajadores/copiar', async (req, res) => {
  const { de, a } = req.query;
  if (!de || !a) {
    return res.status(400).json({ error: 'Parámetros requeridos: de=YYYY-MM & a=YYYY-MM' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const src = await client.query(
      `SELECT DISTINCT nombre
         FROM trabajadores
        WHERE periodo = $1
        ORDER BY nombre`,
      [de]
    );

    if (src.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `No hay registros en ${de}` });
    }

    const inserted = [];
    for (const row of src.rows) {
      // evitar duplicados en destino
      const exists = await client.query(
        `SELECT id FROM trabajadores WHERE periodo = $1 AND nombre = $2 LIMIT 1`,
        [a, row.nombre]
      );
      if (exists.rowCount > 0) continue;

      const ins = await client.query(
        `INSERT INTO trabajadores
           (periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab)
         VALUES ($1,$2,0,0,0,0,'',0)
         RETURNING id, periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab`,
        [a, row.nombre]
      );
      inserted.push(ins.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ copiados: inserted.length, registros: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /trabajadores/copiar', err);
    res.status(500).json({ error: 'Error al copiar planilla' });
  } finally {
    client.release();
  }
});

export default router;
