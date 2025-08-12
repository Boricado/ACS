import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * GET /api/facturas_estado
 * Params opcionales:
 *   - proveedor: string (filtra por nombre de proveedor, normalizado)
 *   - estado_pago: string (filtra por estado_calculado o por estado_pago real)
 */
router.get('/', async (req, res) => {
  const { proveedor, estado_pago } = req.query;

  const where = [];
  const params = [];

  // Filtro por proveedor (por nombre normalizado contra el campo de la factura)
  if (proveedor && proveedor.trim()) {
    params.push(proveedor.trim());
    where.push(
      `REGEXP_REPLACE(LOWER(d.proveedor),'[\\s.\\-_/,&]+','','g')
       = REGEXP_REPLACE(LOWER($${params.length}),'[\\s.\\-_/,&]+','','g')`
    );
  }

  // Filtro por estado: aceptamos tanto el "estado_pago" de BD como el "estado_calculado"
  if (estado_pago && estado_pago.trim()) {
    params.push(estado_pago.trim());
    where.push(`(j.estado_calculado = $${params.length} OR d.estado_pago = $${params.length})`);
  }

  // Nota: usamos dos LEFT JOIN separados (por id y por nombre) para evitar el ON con OR
  const sql = `
    WITH d AS (
      SELECT
        f.id,
        -- maneja columnas fecha/fecha_pago que puedan ser texto o NULL
        NULLIF(f.fecha, '')::date        AS fecha,
        f.proveedor,
        f.proveedor_id,
        f.numero_guia,
        f.numero_factura,
        f.monto_neto,
        f.iva,
        f.monto_total,
        f.estado_pago,
        NULLIF(f.fecha_pago, '')::date   AS fecha_pago
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
        COALESCE(p_id.dias_credito, p_nm.dias_credito, 0) AS dias_credito,
        CASE
          WHEN COALESCE(p_id.dias_credito, p_nm.dias_credito, 0) = 0 THEN NULL
          ELSE (d.fecha + (COALESCE(p_id.dias_credito, p_nm.dias_credito, 0) * INTERVAL '1 day'))::date
        END AS vencimiento,
        CASE
          WHEN COALESCE(p_id.dias_credito, p_nm.dias_credito, 0) = 0 THEN 'Contado'
          WHEN d.estado_pago = 'Pagado' THEN 'Pagada'
          WHEN (d.fecha + (COALESCE(p_id.dias_credito, p_nm.dias_credito, 0) * INTERVAL '1 day'))::date < CURRENT_DATE
               THEN 'Vencida'
          ELSE 'Vigente'
        END AS estado_calculado
      FROM d
      LEFT JOIN p p_id
        ON d.proveedor_id IS NOT NULL AND p_id.id = d.proveedor_id
      LEFT JOIN p p_nm
        ON d.proveedor_id IS NULL
       AND REGEXP_REPLACE(LOWER(d.proveedor),'[\\s.\\-_/,&]+','','g') = p_nm.norm_nombre
    )
    SELECT
      j.id,
      to_char(j.fecha, 'YYYY-MM-DD')         AS fecha,
      j.proveedor,
      j.proveedor_id,
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
    console.error('❌ GET /api/facturas_estado', err);
    res.status(500).json({ error: 'Error al obtener facturas con estado' });
  }
});

export default router;
