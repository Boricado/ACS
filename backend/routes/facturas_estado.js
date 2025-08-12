// backend/routes/facturas_estado.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * Parser seguro de fechas en SQL (acepta varios formatos comunes).
 * Devuelve DATE o NULL (nunca lanza error por formatos vacíos/raros).
 */
const safeDateSql = (col) => `
CASE
  WHEN ${col} IS NULL THEN NULL
  WHEN btrim((${col})::text) = '' THEN NULL
  -- YYYY-MM-DD
  WHEN btrim((${col})::text) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    THEN ((${col})::text)::date
  -- YYYY-M-D  (mes/día 1 o 2 dígitos)
  WHEN btrim((${col})::text) ~ '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$'
    THEN to_date(btrim((${col})::text), 'YYYY-FMMM-FMDD')
  -- YYYY/MM/DD
  WHEN btrim((${col})::text) ~ '^[0-9]{4}/[0-9]{2}/[0-9]{2}$'
    THEN to_date(btrim((${col})::text), 'YYYY/MM/DD')
  -- YYYY/M/D
  WHEN btrim((${col})::text) ~ '^[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}$'
    THEN to_date(btrim((${col})::text), 'YYYY/FMMM/FMDD')
  ELSE NULL
END
`;

router.get('/', async (req, res) => {
  const { proveedor, estado_pago } = req.query;

  const where = [];
  const params = [];

  if (proveedor && proveedor.trim()) {
    params.push(proveedor.trim());
    // compara por nombre normalizado (minúsculas sin espacios/puntuación)
    where.push(
      `d.norm_proveedor = REGEXP_REPLACE(LOWER($${params.length}),'[\\s.\\-_/,&]+','','g')`
    );
  }

  // permite filtrar tanto por el estado original como por el calculado
  if (estado_pago && estado_pago.trim()) {
    params.push(estado_pago.trim());
    where.push(`(j.estado_calculado = $${params.length} OR d.estado_pago = $${params.length})`);
  }

  const sql = `
    WITH d AS (
      SELECT
        f.id,
        ${safeDateSql('f.fecha')}        AS fecha,
        f.proveedor,
        REGEXP_REPLACE(LOWER(f.proveedor),'[\\s.\\-_/,&]+','','g') AS norm_proveedor,
        f.numero_guia,
        f.numero_factura,
        f.monto_neto,
        f.iva,
        f.monto_total,
        f.estado_pago,
        ${safeDateSql('f.fecha_pago')}   AS fecha_pago
      FROM facturas_guias f
    ),
    p AS (
      SELECT
        p.id,
        p.nombre,
        COALESCE(p.dias_credito, 0) AS dias_credito,
        REGEXP_REPLACE(LOWER(p.nombre),'[\\s.\\-_/,&]+','','g') AS norm_nombre
      FROM proveedores p
    ),
    j AS (
      SELECT
        d.*,
        COALESCE(p_nm.dias_credito, 0) AS dias_credito,
        CASE
          WHEN COALESCE(p_nm.dias_credito, 0) = 0 OR d.fecha IS NULL THEN NULL
          ELSE (d.fecha + (COALESCE(p_nm.dias_credito, 0) * INTERVAL '1 day'))::date
        END AS vencimiento,
        CASE
          WHEN COALESCE(p_nm.dias_credito, 0) = 0 THEN 'Contado'
          WHEN d.estado_pago = 'Pagado' THEN 'Pagada'
          WHEN d.fecha IS NULL THEN 'Vigente'
          WHEN (d.fecha + (COALESCE(p_nm.dias_credito, 0) * INTERVAL '1 day'))::date < CURRENT_DATE
               THEN 'Vencida'
          ELSE 'Vigente'
        END AS estado_calculado
      FROM d
      LEFT JOIN p p_nm
        ON d.norm_proveedor = p_nm.norm_nombre
    )
    SELECT
      j.id,
      to_char(j.fecha, 'YYYY-MM-DD')         AS fecha,
      j.proveedor,
      j.numero_guia,
      j.numero_factura,
      j.monto_neto,
      j.iva,
      j.monto_total,
      j.estado_pago,
      to_char(j.fecha_pago, 'YYYY-MM-DD')    AS fecha_pago,
      j.dias_credito,
      to_char(j.vencimiento, 'YYYY-MM-DD')   AS vencimiento,
      j.estado_calculado
    FROM j
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY j.fecha DESC NULLS LAST, j.id DESC;
  `;

  try {
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) {
    console.error('GET /api/facturas_estado error:', err);
    res.status(500).json({ error: 'Error al obtener facturas con estado' });
  }
});

export default router;
