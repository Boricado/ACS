import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * GET /api/facturas_estado
 * Opcional: ?proveedor=<string>&estado_pago=<Pagado|Pendiente|Vigente|Vencida|Contado|Pagada>
 */
router.get('/', async (req, res) => {
  const { proveedor, estado_pago } = req.query;

  const where = [];
  const params = [];

  if (proveedor) {
    params.push(proveedor);
    // normaliza para comparar nombres
    where.push(
      `REGEXP_REPLACE(LOWER(proveedor),'[\\s.\\-_/,&]+','','g') = REGEXP_REPLACE(LOWER($${params.length}),'[\\s.\\-_/,&]+','','g')`
    );
  }

  if (estado_pago) {
    params.push(estado_pago);
    // permite filtrar por el estado real de DB o el estado_calculado
    where.push(`(estado_pago = $${params.length} OR estado_calculado = $${params.length})`);
  }

  const sql = `
  WITH data AS (
    SELECT
      f.id,
      (f.fecha)::date AS fecha,
      f.proveedor,
      f.proveedor_id,
      f.numero_guia,
      f.numero_factura,
      f.monto_neto,
      f.iva,
      f.monto_total,
      f.estado_pago,
      (f.fecha_pago)::date AS fecha_pago
    FROM facturas_guias f
  ),
  prov AS (
    SELECT
      p.id,
      p.nombre,
      COALESCE(p.dias_credito,0) AS dias_credito,
      REGEXP_REPLACE(LOWER(p.nombre),'[\\s.\\-_/,&]+','','g') AS norm_nombre
    FROM proveedores p
  ),
  joined AS (
    SELECT
      d.*,
      p.id   AS proveedor_match_id,
      p.nombre AS proveedor_match_nombre,
      p.dias_credito,
      CASE
        WHEN COALESCE(p.dias_credito,0) = 0 THEN NULL
        ELSE (d.fecha + (COALESCE(p.dias_credito,0) || ' days')::interval)::date
      END AS vencimiento,
      CASE
        WHEN COALESCE(p.dias_credito,0) = 0 THEN 'Contado'
        WHEN d.estado_pago = 'Pagado'      THEN 'Pagada'
        WHEN (d.fecha + (COALESCE(p.dias_credito,0) || ' days')::interval)::date < CURRENT_DATE THEN 'Vencida'
        ELSE 'Vigente'
      END AS estado_calculado
    FROM data d
    LEFT JOIN prov p
      ON (
           d.proveedor_id IS NOT NULL AND p.id = d.proveedor_id
         )
      OR (
           d.proveedor_id IS NULL
       AND REGEXP_REPLACE(LOWER(d.proveedor),'[\\s.\\-_/,&]+','','g') = p.norm_nombre
         )
  )
  SELECT
    id,
    to_char(fecha,'YYYY-MM-DD')        AS fecha,
    proveedor,
    proveedor_id,
    numero_guia,
    numero_factura,
    monto_neto,
    iva,
    monto_total,
    estado_pago,
    to_char(fecha_pago,'YYYY-MM-DD')   AS fecha_pago,
    dias_credito,
    to_char(vencimiento,'YYYY-MM-DD')  AS vencimiento,
    estado_calculado
  FROM joined
  WHERE 1=1
  ${where.length ? ' AND ' + where.join(' AND ') : ''}
  ORDER BY fecha DESC, id DESC
  `;

  try {
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) {
    console.error('❌ GET /api/facturas_estado', err);
    res.status(500).json({ error: 'Error al obtener facturas con estado' });
  }
});

export default router;
