import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET: Listar todas las facturas/guías con filtros
router.get('/', async (req, res) => {
  const { proveedor, estado_pago } = req.query;
  let query = 'SELECT * FROM facturas_guias WHERE 1=1';
  const params = [];

  if (proveedor) {
    params.push(proveedor);
    query += ` AND proveedor = $${params.length}`;
  }

  if (estado_pago) {
    params.push(estado_pago);
    query += ` AND estado_pago = $${params.length}`;
  }

  query += ` ORDER BY fecha DESC`;

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener facturas/guías:', err);
    res.status(500).json({ error: 'Error al obtener facturas/guías' });
  }
});

// POST: Registrar nueva factura/guía con cálculo de fecha de vencimiento si no se entrega
router.post('/', async (req, res) => {
  const {
    proveedor,
    rut_proveedor,
    numero_guia,
    numero_factura,
    fecha,
    monto_neto,
    iva,
    monto_total,
    estado_pago = 'Pendiente',
    dias_credito: diasCreditoManual,
    fecha_vencimiento,
    fecha_pago,
    observacion,
    observaciones_internas
  } = req.body;


  try {
    // Obtener días de crédito desde proveedores si no vienen como parámetro
    let dias_credito = diasCreditoManual;
    if (!dias_credito && proveedor) {
      const result = await pool.query('SELECT dias_credito FROM proveedores WHERE proveedor = $1', [proveedor]);
      dias_credito = result.rows[0]?.dias_credito || 0;
    }

    // Calcular fecha de vencimiento si no se entrega
    let fecha_venc = fecha_vencimiento;
    if (!fecha_venc && fecha) {
      const fechaObj = new Date(fecha);
      fechaObj.setDate(fechaObj.getDate() + parseInt(dias_credito));
      fecha_venc = fechaObj.toISOString().split('T')[0];
    }

await pool.query(
  `INSERT INTO facturas_guias (
    proveedor,
    rut_proveedor,
    numero_guia,
    numero_factura,
    fecha,
    monto_neto,
    iva,
    monto_total,
    estado_pago,
    dias_credito,
    fecha_vencimiento,
    fecha_pago,
    observacion,
    observaciones_internas
  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
  [
    proveedor,
    rut_proveedor,
    numero_guia,
    numero_factura,
    fecha,
    monto_neto,
    iva,
    monto_total,
    estado_pago,
    dias_credito,
    fecha_vencimiento,
    fecha_pago,
    observacion,
    observaciones_internas
  ]
);


    res.status(201).json({ message: 'Factura/Guía registrada' });
  } catch (err) {
    console.error('❌ Error al registrar factura/guía:', err);
    res.status(500).json({ error: 'Error al registrar factura/guía' });
  }
});

// PUT: Actualizar estado de pago y/o fecha_pago y/o observaciones internas
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { estado_pago, fecha_pago, observaciones_internas } = req.body;

  const campos = [];
  const valores = [];
  let idx = 1;

  if (estado_pago !== undefined) {
    campos.push(`estado_pago = $${idx++}`);
    valores.push(estado_pago);
  }

  if (fecha_pago !== undefined) {
    campos.push(`fecha_pago = $${idx++}`);
    valores.push(fecha_pago);
  }

  if (observaciones_internas !== undefined) {
    campos.push(`observaciones_internas = $${idx++}`);
    valores.push(observaciones_internas);
  }

  if (campos.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
  }

  valores.push(id);

  try {
    await pool.query(
      `UPDATE facturas_guias SET ${campos.join(', ')} WHERE id = $${valores.length}`,
      valores
    );
    res.json({ message: 'Factura/Guía actualizada correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar factura/guía:', err);
    res.status(500).json({ error: 'Error al actualizar factura/guía' });
  }
});

export default router;
