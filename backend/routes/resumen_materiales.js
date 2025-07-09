// routes/resumen_materiales.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/resumen-materiales
router.get('/', async (req, res) => {
  try {
    const obras = await pool.query(`
      SELECT so.id, so.cliente_nombre, so.presupuesto_numero, so.nombre_obra,
             p.id AS presupuesto_id, p.total_neto_presupuestado
      FROM seguimiento_obras so
      LEFT JOIN presupuestos p ON so.presupuesto_numero = p.numero
      ORDER BY so.id DESC
    `);

    console.log('✅ Obras cargadas:', obras.rows.length);

    // Revisa si hay algún valor extraño que pueda romper el JSON
    obras.rows.forEach((o, i) => {
      if (!o.cliente_nombre || !o.presupuesto_numero || !o.nombre_obra) {
        console.warn(`⚠️ Registro incompleto en fila ${i}:`, o);
      }
    });

    res.json(obras.rows);
  } catch (err) {
    console.error('❌ Error al obtener resumen de obras:', err.stack || err.message);
    res.status(500).json({ error: 'Error interno al cargar resumen de obras' });
  }
});



// GET /api/resumen-materiales/detalle/:presupuesto_numero
router.get('/detalle/:presupuesto_numero', async (req, res) => {
  const { presupuesto_numero } = req.params;

  console.log('📌 Consultando detalle de materiales para presupuesto:', presupuesto_numero);

  try {
    const tablas = [
      'ot_pautas_perfiles', 'ot_pautas_refuerzos', 'ot_pautas_tornillos',
      'ot_pautas_herraje', 'ot_pautas_accesorios', 'ot_pautas_gomascepillos',
      'ot_pautas_vidrio', 'ot_pautas_instalacion'
    ];

    let materiales = [];

    for (const tabla of tablas) {
      try {
        const result = await pool.query(`
          SELECT codigo, producto, cantidad AS stock_reservado, unidad, separado,
            (SELECT SUM(cantidad) FROM detalle_oc WHERE codigo = t.codigo) AS stock_llegado,
            (SELECT precio_unitario FROM detalle_oc WHERE codigo = t.codigo ORDER BY id DESC LIMIT 1) AS precio
          FROM ${tabla} t
          WHERE numero_presupuesto = $1
        `, [presupuesto_numero]);

        materiales.push(...result.rows);
      } catch (tablaError) {
        console.error(`❌ Error en tabla ${tabla}:`, tablaError.message);
      }
    }

    const detalle = materiales.map(mat => {
      const stock_llegado = mat.stock_llegado || 0;
      const pendiente = mat.stock_reservado - stock_llegado;
      const total_neto = (mat.precio || 0) * (mat.stock_reservado || 0);
      return {
        ...mat,
        stock_llegado,
        pendiente,
        total_neto
      };
    });

    res.json(detalle);
  } catch (err) {
    console.error('❌ Error al obtener materiales del presupuesto:', err.message);
    res.status(500).json({ error: 'Error al cargar materiales del presupuesto' });
  }
});

// PUT /api/resumen-materiales/presupuesto/:id
router.put('/presupuesto/:id', async (req, res) => {
  const { id } = req.params;
  const { total_neto_presupuestado } = req.body;

  if (!total_neto_presupuestado || isNaN(total_neto_presupuestado)) {
    return res.status(400).json({ error: 'Valor presupuestado inválido' });
  }

  try {
    await pool.query(
      'UPDATE presupuestos SET total_neto_presupuestado = $1 WHERE id = $2',
      [total_neto_presupuestado, id]
    );

    res.status(200).json({ message: 'Presupuesto actualizado correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar presupuesto:', err.message);
    res.status(500).json({ error: 'Error interno al actualizar presupuesto' });
  }
});

export default router;
