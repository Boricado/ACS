// backend/routes/facturas_estado.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

/** Fechas seguras (evita reventar con vacíos o formatos raros) */
const safeDateSql = (col) => `
CASE
  WHEN ${col} IS NULL THEN NULL
  WHEN btrim((${col})::text) = '' THEN NULL
  WHEN btrim((${col})::text) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    THEN ((${col})::text)::date
  WHEN btrim((${col})::text) ~ '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$'
    THEN to_date(btrim((${col})::text), 'YYYY-FMMM-FMDD')
  WHEN btrim((${col})::text) ~ '^[0-9]{4}/[0-9]{2}/[0-9]{2}$'
    THEN to_date(btrim((${col})::text), 'YYYY/MM/DD')
  WHEN btrim((${col})::text) ~ '^[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}$'
    THEN to_date(btrim((${col})::text), 'YYYY/FMMM/FMDD')
  ELSE NULL
END
`;

/** 
 * Normalizador robusto:
 * - quita sufijos legales (sa, ltda, limitada, spa, eirl)
 * - pasa a minúscula, quita tildes
 * - elimina todo lo no alfanumérico
 */
const normNameSql = (col) => `
REGEXP_REPLACE(
  REGEXP_REPLACE(
    LOWER(
      translate(
        -- quitamos sufijos legales antes de normalizar
        regexp_replace(trim(${col}),
          '(?i)\\m(s\\.?a\\.?|ltda\\.?|limitada|spa|e\\.i\\.r\\.l\\.|eirl)\\M', '', 'g'
        ),
        'ÁÀÂÄÃÅáàâäãåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÖÕóòôöõÚÙÛÜúùûüÇçÑñ',
        'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
      )
    ),
    '[^a-z0-9]+', '', 'g'   -- quitar todo lo no alfanumérico
  ),
  '(\\s+)', '', 'g'
)
`;

router.get('/', async (req, res) => {
  const { proveedor, estado_pago } = req.query;
  const where = [];
  const params = [];

  if (proveedor && proveedor.trim()) {
    params.push(proveedor.trim());
    where.push(`${normNameSql('d.proveedor')} = ${normNameSql(`$${params.length}`)}`);
  }

  if (estado_pago && estado_pago.trim()) {
    const est = estado_pago.trim();
    if (est.toLowerCase() === 'contado') {
      where.push(`j.dias_credito = 0`);
    } else {
      params.push(est);
      where.push(`(j.estado_calculado = $${params.length} OR d.estado_pago = $${params.length})`);
    }
  }

  const sql = `
    WITH d AS (
      SELECT
        f.id,
        ${safeDateSql('f.fecha')}      AS fecha,
        trim(f.proveedor)              AS proveedor,
        f.numero_guia,
        f.numero_factura,
        f.monto_neto,
        f.iva,
        f.monto_total,
        f.estado_pago,
        ${safeDateSql('f.fecha_pago')} AS fecha_pago
      FROM facturas_guias f
    ),
    p_norm AS (
      SELECT DISTINCT ON (${normNameSql('p.proveedor')})
        p.id,
        trim(p.proveedor)              AS proveedor,
        COALESCE(p.dias_credito,0)::int AS dias_credito,
        ${normNameSql('p.proveedor')}  AS norm_nombre
      FROM proveedores p
      ORDER BY ${normNameSql('p.proveedor')}, p.id DESC
    ),
    j AS (
      SELECT
        d.*,
        COALESCE(p_norm.dias_credito,0)::int AS dias_credito,
        CASE
          WHEN COALESCE(p_norm.dias_credito,0) = 0 OR d.fecha IS NULL
            THEN NULL
          ELSE (d.fecha + make_interval(days => COALESCE(p_norm.dias_credito,0)::int))::date
        END AS vencimiento,
        CASE
          WHEN COALESCE(p_norm.dias_credito,0) = 0 THEN 'Contado'
          WHEN d.estado_pago = 'Pagado' THEN 'Pagado'
          WHEN d.fecha IS NULL THEN 'Vigente'
          WHEN (d.fecha + make_interval(days => COALESCE(p_norm.dias_credito,0)::int))::date < CURRENT_DATE
            THEN 'Vencida'
          ELSE 'Vigente'
        END AS estado_calculado
      FROM d
      LEFT JOIN p_norm
        ON ${normNameSql('d.proveedor')} = p_norm.norm_nombre
    )
    SELECT
      j.id,
      to_char(j.fecha, 'YYYY-MM-DD')       AS fecha,
      j.proveedor,
      j.numero_guia,
      j.numero_factura,
      j.monto_neto,
      j.iva,
      j.monto_total,
      j.estado_pago,
      to_char(j.fecha_pago, 'YYYY-MM-DD')  AS fecha_pago,
      j.dias_credito,
      to_char(j.vencimiento, 'YYYY-MM-DD') AS vencimiento,
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
