import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Lista blanca de campos permitidos en seguimiento_obras
const camposSeguimientoValidos = [
  'perfiles', 'refuerzos', 'tornillos', 'herraje',
  'accesorios', 'gomas_cepillos', 'vidrio', 'instalacion'
];

// Función para insertar ítem y actualizar seguimiento
const insertarYActualizar = async (req, res, tabla, campoSeguimiento) => {
  const { cliente_id, presupuesto_id, numero_presupuesto, codigo, producto, cantidad } = req.body;

  if (!cliente_id || !presupuesto_id || !numero_presupuesto || !codigo || !producto || !cantidad) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (!camposSeguimientoValidos.includes(campoSeguimiento)) {
    return res.status(400).json({ error: 'Campo de seguimiento no válido' });
  }

  try {
    await pool.query(
      `INSERT INTO ${tabla} (cliente_id, presupuesto_id, numero_presupuesto, codigo, producto, cantidad)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [cliente_id, presupuesto_id, numero_presupuesto, codigo, producto, cantidad]
    );

    await pool.query(
      `UPDATE seguimiento_obras SET ${campoSeguimiento} = TRUE WHERE presupuesto_numero = $1`,
      [numero_presupuesto]
    );

    res.status(201).json({ mensaje: `Ítem guardado en ${tabla} y seguimiento actualizado` });
  } catch (error) {
    console.error(`Error al guardar en ${tabla}:`, error);
    res.status(500).json({ error: `Error al guardar en ${tabla}` });
  }
};

// Función genérica para obtener reservas activas (sólo obras con recepcion_final = false)
const obtenerReservasActivas = async (req, res, tabla) => {
  try {
    const result = await pool.query(`
      SELECT p.*
      FROM ${tabla} p
      INNER JOIN seguimiento_obras s ON p.numero_presupuesto = s.presupuesto_numero
      WHERE s.recepcion_final = false
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(`❌ Error al obtener reservas desde ${tabla}:`, err);
    res.status(500).json({ error: `Error al obtener datos desde ${tabla}` });
  }
};

// Rutas POST por cada tipo de pauta
router.post('/perfiles', (req, res) => insertarYActualizar(req, res, 'ot_pautas_perfiles', 'perfiles'));
router.post('/refuerzos', (req, res) => insertarYActualizar(req, res, 'ot_pautas_refuerzos', 'refuerzos'));
router.post('/tornillos', (req, res) => insertarYActualizar(req, res, 'ot_pautas_tornillos', 'tornillos'));
router.post('/herraje', (req, res) => insertarYActualizar(req, res, 'ot_pautas_herraje', 'herraje'));
router.post('/accesorios', (req, res) => insertarYActualizar(req, res, 'ot_pautas_accesorios', 'accesorios'));
router.post('/gomascepillos', (req, res) => insertarYActualizar(req, res, 'ot_pautas_gomascepillos', 'gomas_cepillos'));
router.post('/vidrio', (req, res) => insertarYActualizar(req, res, 'ot_pautas_vidrio', 'vidrio'));
router.post('/instalacion', (req, res) => insertarYActualizar(req, res, 'ot_pautas_instalacion', 'instalacion'));

// Rutas PUT para actualizar cantidad en cada tabla
const actualizarCantidad = async (req, res, tabla) => {
  const { id } = req.params;
  const { cantidad } = req.body;

  if (!id || cantidad === undefined) {
    return res.status(400).json({ error: 'ID o cantidad faltante' });
  }

  try {
    await pool.query(
      `UPDATE ${tabla} SET cantidad = $1 WHERE id = $2`,
      [cantidad, id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(`Error al actualizar pauta en ${tabla}:`, err);
    res.status(500).json({ error: `Error al actualizar pauta en ${tabla}` });
  }
};

router.put('/perfiles/:id', (req, res) => actualizarCantidad(req, res, 'ot_pautas_perfiles'));
router.put('/refuerzos/:id', (req, res) => actualizarCantidad(req, res, 'ot_pautas_refuerzos'));
router.put('/tornillos/:id', (req, res) => actualizarCantidad(req, res, 'ot_pautas_tornillos'));
router.put('/herraje/:id', (req, res) => actualizarCantidad(req, res, 'ot_pautas_herraje'));
router.put('/accesorios/:id', (req, res) => actualizarCantidad(req, res, 'ot_pautas_accesorios'));
router.put('/gomascepillos/:id', (req, res) => actualizarCantidad(req, res, 'ot_pautas_gomascepillos'));
router.put('/vidrio/:id', (req, res) => actualizarCantidad(req, res, 'ot_pautas_vidrio'));
router.put('/instalacion/:id', (req, res) => actualizarCantidad(req, res, 'ot_pautas_instalacion'));

// Rutas GET con filtro de obras activas
router.get('/perfiles', (req, res) => obtenerReservasActivas(req, res, 'ot_pautas_perfiles'));
router.get('/refuerzos', (req, res) => obtenerReservasActivas(req, res, 'ot_pautas_refuerzos'));
router.get('/tornillos', (req, res) => obtenerReservasActivas(req, res, 'ot_pautas_tornillos'));
router.get('/herraje', (req, res) => obtenerReservasActivas(req, res, 'ot_pautas_herraje'));
router.get('/accesorios', (req, res) => obtenerReservasActivas(req, res, 'ot_pautas_accesorios'));
router.get('/gomascepillos', (req, res) => obtenerReservasActivas(req, res, 'ot_pautas_gomascepillos'));
router.get('/vidrio', (req, res) => obtenerReservasActivas(req, res, 'ot_pautas_vidrio'));
router.get('/instalacion', (req, res) => obtenerReservasActivas(req, res, 'ot_pautas_instalacion'));

const categorias = [
  { ruta: 'perfiles', tabla: 'ot_pautas_perfiles', campo: 'perfiles' },
  { ruta: 'refuerzos', tabla: 'ot_pautas_refuerzos', campo: 'refuerzos' },
  { ruta: 'tornillos', tabla: 'ot_pautas_tornillos', campo: 'tornillos' },
  { ruta: 'herraje', tabla: 'ot_pautas_herraje', campo: 'herraje' },
  { ruta: 'accesorios', tabla: 'ot_pautas_accesorios', campo: 'accesorios' },
  { ruta: 'gomascepillos', tabla: 'ot_pautas_gomascepillos', campo: 'gomas_cepillos' },
  { ruta: 'vidrio', tabla: 'ot_pautas_vidrio', campo: 'vidrio' },
  { ruta: 'instalacion', tabla: 'ot_pautas_instalacion', campo: 'instalacion' },
];

for (const { ruta, tabla, campo } of categorias) {
  router.post(`/${ruta}/lote`, async (req, res) => {
    const { cliente_id, presupuesto_id, numero_presupuesto, items } = req.body;

    if (!cliente_id || !presupuesto_id || !numero_presupuesto || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Faltan datos o items[] inválido' });
    }

    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const item of items) {
          const { codigo, producto, cantidad } = item;
          if (!codigo || !producto || !cantidad) continue;

          await client.query(
            `INSERT INTO ${tabla} (cliente_id, presupuesto_id, numero_presupuesto, codigo, producto, cantidad, cantidad_original)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [cliente_id, presupuesto_id, numero_presupuesto, codigo, producto, cantidad, item.cantidad_original || cantidad]
          );

          await client.query(
            `UPDATE seguimiento_obras SET ${campo} = TRUE WHERE presupuesto_numero = $1`,
            [numero_presupuesto]
          );
        }

        await client.query('COMMIT');
        res.status(201).json({ mensaje: `Carga por lote exitosa en ${tabla}` });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error en lote (${tabla}):`, error);
        res.status(500).json({ error: `Error en lote: ${tabla}` });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error conexión pool:', error);
      res.status(500).json({ error: 'Error de conexión' });
    }
  });
}

router.post('/:categoria/lote', async (req, res) => {
  const { categoria } = req.params;
  const { cliente_id, presupuesto_id, numero_presupuesto, items } = req.body;

  const tabla = `ot_pautas_${categoria}`;
  const camposValidos = [
    'codigo', 'producto', 'cantidad', 'cantidad_original',
    'cliente_id', 'presupuesto_id', 'numero_presupuesto'
  ];

  if (!cliente_id || !presupuesto_id || !numero_presupuesto || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos' });
  }

  try {
    const valores = items.map(item => [
      item.codigo,
      item.producto,
      item.cantidad,
      item.cantidad_original || item.cantidad, // fallback
      cliente_id,
      presupuesto_id,
      numero_presupuesto
    ]);

    const placeholders = valores.map(
      (_, i) => `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`
    ).join(', ');

    const flatValues = valores.flat();

    const query = `
      INSERT INTO ${tabla} (${camposValidos.join(', ')})
      VALUES ${placeholders}
    `;

    await pool.query(query, flatValues);

    // Actualizar estado en seguimiento_obras
    await pool.query(
      `UPDATE seguimiento_obras SET ${categoria} = true WHERE presupuesto_id = $1`,
      [presupuesto_id]
    );

    res.json({ mensaje: 'Carga por lote exitosa' });
  } catch (error) {
    console.error(`Error al guardar en ${tabla}:`, error);
    res.status(500).json({ error: 'Error interno al guardar los datos' });
  }
});


export default router;
