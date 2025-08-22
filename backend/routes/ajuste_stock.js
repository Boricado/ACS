import express from 'express';
import pool from '../db.js';

const router = express.Router();

/* ===========================================
   AJUSTE MANUAL DE STOCK (ya lo tenías)
   =========================================== */

// POST: Registrar un ajuste manual de stock
router.post('/', async (req, res) => {
  const { codigo, producto, diferencia, usuario } = req.body; // acepta usuario opcional

  if (!codigo || !producto || diferencia === undefined) {
    return res.status(400).json({ error: 'Faltan datos para el ajuste' });
  }

  try {
    const cantidad = parseInt(diferencia);
    if (isNaN(cantidad)) {
      return res.status(400).json({ error: 'Diferencia no válida' });
    }

    const hoy = new Date();
    const fecha = hoy.toISOString().split('T')[0]; // YYYY-MM-DD
    const fechaAjusteTexto = fecha.split('-').reverse().join('-'); // DD-MM-YYYY
    const diferenciaInvertida = -cantidad; // respeta la lógica de salidas
    const quien = (usuario || '').toString().trim();
    const comentarioAjuste = `Ajuste ${fechaAjusteTexto}${quien ? ' • ' + quien : ''}`;

    // 1) Insertar en historial de salidas
    await pool.query(
      `
      INSERT INTO salidas_inventario2 (
        cliente_nombre,
        presupuesto_numero,
        nombre_obra,
        codigo,
        producto,
        cantidad,
        precio_neto,
        fecha,
        comentario_ajuste
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
      `,
      [
        'ALUMCE - Stock',
        'AJUSTE',
        'Ajuste de Inventario',
        codigo,
        producto,
        diferenciaInvertida,
        fecha,
        comentarioAjuste
      ]
    );

    // 2) Obtener stock actual
    const result = await pool.query(
      'SELECT stock_actual FROM inventario WHERE codigo = $1',
      [codigo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const stockAnterior = parseInt(result.rows[0].stock_actual);
    const nuevoStock = stockAnterior + cantidad;

    // 3) Actualizar inventario
    await pool.query(
      `
      UPDATE inventario
      SET stock_actual = $1
      WHERE codigo = $2
      `,
      [nuevoStock, codigo]
    );

    res.status(200).json({ mensaje: 'Ajuste aplicado correctamente' });
  } catch (error) {
    console.error('❌ Error al registrar ajuste:', error.message);
    res.status(500).json({ error: 'Error interno al registrar ajuste' });
  }
});

// GET: Último ajuste por código
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT codigo, 
             MAX(fecha) AS fecha, 
             MAX(comentario_ajuste) AS comentario_ajuste
      FROM salidas_inventario2
      WHERE comentario_ajuste IS NOT NULL
      GROUP BY codigo
    `);

    const ajustes = {};
    result.rows.forEach(row => {
      ajustes[row.codigo] = {
        fecha: row.fecha,
        comentario: row.comentario_ajuste
      };
    });

    res.json(ajustes);
  } catch (error) {
    console.error('❌ Error al obtener ajustes:', error.message);
    res.status(500).json({ error: 'Error al obtener últimos ajustes' });
  }
});

/* ===========================================
   NUEVO 1: Actualizar SOLO nombre en "materiales"
   Ruta final (si montas este router en /api/ajuste_stock):
   PUT /api/ajuste_stock/materiales/:codigo/nombre
   =========================================== */
router.put('/materiales/:codigo/nombre', async (req, res) => {
  const { codigo } = req.params;
  const { producto } = req.body;

  const nuevoNombre = (producto || '').trim();
  if (!codigo) return res.status(400).json({ error: 'Falta el código' });
  if (!nuevoNombre) return res.status(400).json({ error: 'El nombre de producto no puede estar vacío' });

  try {
    const updMat = await pool.query(
      `UPDATE materiales
       SET producto = $1
       WHERE codigo = $2
       RETURNING codigo, producto`,
      [nuevoNombre, codigo]
    );

    if (updMat.rowCount === 0) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    res.json({ mensaje: 'Nombre actualizado', material: updMat.rows[0] });
  } catch (err) {
    console.error('❌ Error al actualizar material (solo-materiales):', err);
    res.status(500).json({ error: 'Error interno al actualizar material' });
  }
});

/* ===========================================
   NUEVO 2: Inventario con nombre desde "materiales"
   Ruta final (si montas este router en /api/ajuste_stock):
   GET /api/ajuste_stock/inventario_join
   =========================================== */
router.get('/inventario_join', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        i.codigo,
        COALESCE(m.producto, '') AS producto,
        i.stock_actual,
        i.stock_minimo,
        i.unidad
      FROM inventario i
      LEFT JOIN materiales m ON m.codigo = i.codigo
      ORDER BY m.producto NULLS LAST, i.codigo
    `);

    res.json(resultado.rows);
  } catch (err) {
    console.error('❌ ERROR en /api/ajuste_stock/inventario_join:', err.message);
    res.status(500).json({ error: 'Error al obtener inventario (join)' });
  }
});

export default router;
