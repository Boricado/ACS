import express from 'express';
import pg from 'pg';
import fs from 'fs';
import cors from 'cors';

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ASC',
  password: 'admin123',
  port: 5432,
});

app.post('/api/clientes', async (req, res) => {
  const { nombre, rut, correo, telefono, direccion } = req.body;

  const jsonPath = './respaldo_clientes.json';
  let respaldo = [];

  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath);
    respaldo = JSON.parse(raw);
  }

  respaldo.push({ nombre, rut, correo, telefono, direccion });
  fs.writeFileSync(jsonPath, JSON.stringify(respaldo, null, 2));

  try {
    const query = `
      INSERT INTO clientes (nombre, rut, correo, telefono, direccion)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [nombre, rut, correo, telefono, direccion]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al insertar en PostgreSQL:', err.message);
    res.status(500).json({ error: 'Error al guardar en la base de datos' });
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener clientes:', err.message);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

app.post('/api/presupuestos', async (req, res) => {
  const { numero, cliente_id, nombre_obra, direccion, observacion, fecha } = req.body;

  try {
    const query = `
      INSERT INTO presupuestos (numero, cliente_id, nombre_obra, direccion, observacion, fecha)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [numero || null, cliente_id || null, nombre_obra || null, direccion || null, observacion || null, fecha || new Date()];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al insertar presupuesto:', err.message);
    res.status(500).json({ error: 'Error al guardar presupuesto' });
  }
});

app.post('/api/items_presupuesto', async (req, res) => {
  const {
    presupuesto_id,
    item,
    recinto,
    ancho,
    alto,
    tipo_apertura,
    grada_buque,
    observaciones,
    cantidad,
    precio_unitario,
    tipo_ventana,
    cuadros_adicionales,
    texto_observaciones,
    adicional
  } = req.body;

  let base_utv = 1;
  switch (tipo_ventana) {
    case 'Fijo': base_utv = 0.5; break;
    case 'Doble corredera con fijo':
    case 'Marco puerta': base_utv = 2; break;
    default: base_utv = 1;
  }

  const adicionales = adicional ? (parseFloat(cuadros_adicionales) || 0) * 0.5 : 0;
  const utv = observaciones ? 0 : base_utv + adicionales;
  const valorUTV = 20000;
  const utv_monto = utv * valorUTV;
  const total = (parseFloat(cantidad) || 0) * (parseFloat(precio_unitario) || 0);

  const jsonPath = './respaldo_items_presupuesto.json';
  let respaldo = [];
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath);
    respaldo = JSON.parse(raw);
  }
  respaldo.push({
    presupuesto_id,
    item,
    recinto,
    ancho,
    alto,
    tipo_apertura,
    grada_buque,
    observaciones,
    cantidad,
    precio_unitario,
    total,
    tipo_ventana,
    cuadros_adicionales,
    utv,
    utv_monto,
    texto_observaciones,
    adicional
  });
  fs.writeFileSync(jsonPath, JSON.stringify(respaldo, null, 2));

  try {
    const query = `
      INSERT INTO items_presupuesto (
        presupuesto_id, item, recinto, ancho, alto, tipo_apertura,
        grada_buque, observaciones, cantidad, precio_unitario,
        tipo_ventana, cuadros_adicionales, utv, utv_monto,
        texto_observaciones, adicional
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16
      ) RETURNING *;
    `;
    const values = [
      parseInt(presupuesto_id) || null,
      item || null,
      recinto || null,
      ancho === '' ? null : parseFloat(ancho),
      alto === '' ? null : parseFloat(alto),
      tipo_apertura || null,
      !!grada_buque,
      !!observaciones,
      cantidad === '' ? 0 : parseInt(cantidad),
      precio_unitario === '' ? 0 : parseInt(precio_unitario),
      tipo_ventana || null,
      cuadros_adicionales === '' ? 0 : parseInt(cuadros_adicionales),
      utv ?? 0,
      utv_monto ?? 0,
      texto_observaciones || null,
      !!adicional
    ];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al insertar ítem:', err.message);
    res.status(500).json({ error: 'Error al guardar en la base de datos' });
  }
});

app.get('/api/items_presupuesto/presupuesto/:presupuesto_id', async (req, res) => {
  const { presupuesto_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM items_presupuesto WHERE presupuesto_id = $1 ORDER BY id',
      [presupuesto_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener ítems del presupuesto:', err.message);
    res.status(500).json({ error: 'Error al consultar ítems del presupuesto' });
  }
});

app.delete('/api/items_presupuesto/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM items_presupuesto WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }
    res.json({ mensaje: 'Ítem eliminado exitosamente', item: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar ítem:', err.message);
    res.status(500).json({ error: 'Error al eliminar el ítem de la base de datos' });
  }
});

app.put('/api/items_presupuesto/:id', async (req, res) => {
  const { id } = req.params;
  const {
    item,
    recinto,
    ancho,
    alto,
    tipo_ventana,
    tipo_apertura,
    grada_buque,
    observaciones,
    texto_observaciones,
    adicional,
    cuadros_adicionales,
    cantidad,
    precio_unitario
  } = req.body;

  let base_utv = 1;
  switch (tipo_ventana) {
    case 'Fijo': base_utv = 0.5; break;
    case 'Doble corredera con fijo':
    case 'Marco puerta': base_utv = 2; break;
    default: base_utv = 1;
  }
  const adicionales = adicional ? (cuadros_adicionales || 0) * 0.5 : 0;
  const utv = observaciones ? 0 : base_utv + adicionales;
  const valorUTV = 20000;
  const utv_monto = utv * valorUTV;

  try {
    const query = `
      UPDATE items_presupuesto
      SET item = $1, recinto = $2, ancho = $3, alto = $4,
          tipo_ventana = $5, tipo_apertura = $6, grada_buque = $7,
          observaciones = $8, texto_observaciones = $9, adicional = $10,
          cuadros_adicionales = $11, cantidad = $12, precio_unitario = $13,
          utv = $14, utv_monto = $15
      WHERE id = $16 RETURNING *;
    `;
    const values = [
      item || null,
      recinto || null,
      ancho === '' ? null : parseFloat(ancho),
      alto === '' ? null : parseFloat(alto),
      tipo_ventana || null,
      tipo_apertura || null,
      !!grada_buque,
      !!observaciones,
      texto_observaciones || null,
      !!adicional,
      cuadros_adicionales === '' ? 0 : parseInt(cuadros_adicionales),
      cantidad === '' ? 0 : parseInt(cantidad),
      precio_unitario === '' ? 0 : parseInt(precio_unitario),
      utv,
      utv_monto,
      id
    ];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar ítem:', err.message);
    res.status(500).json({ error: 'Error al actualizar el ítem en la base de datos' });
  }
});

app.get('/api/presupuestos/cliente/:cliente_id', async (req, res) => {
  const { cliente_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM presupuestos WHERE cliente_id = $1 ORDER BY fecha DESC',
      [cliente_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener presupuestos del cliente:', err.message);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

/////////////////////
app.post('/api/ordenes_compra', async (req, res) => {
  try {
    const { numero_oc, proveedor, fecha, realizado_por, comentario, cliente_id, presupuesto_id, items } = req.body;

    // Verificar si ya existe una orden con ese número para evitar duplicados
    const existeOC = await pool.query(`SELECT 1 FROM ordenes_compra WHERE numero_oc = $1`, [numero_oc]);
    if (existeOC.rowCount > 0) {
      return res.status(400).json({ error: 'Ya existe una orden con este número' });
    }

    // 1. Insertar la orden en ordenes_compra
    const insertOrden = `
      INSERT INTO ordenes_compra (numero_oc, proveedor, fecha, realizado_por, estado_oc, comentario, cliente_id, presupuesto_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    const valuesOrden = [numero_oc, proveedor, fecha, realizado_por, 'PENDIENTE', comentario, cliente_id, presupuesto_id];
    const resultOrden = await pool.query(insertOrden, valuesOrden);
    const ordenId = resultOrden.rows[0].id;

    // 2. Insertar los ítems en detalle_oc
    const insertDetalle = `
      INSERT INTO detalle_oc (orden_id, codigo, producto, cantidad, precio_unitario, numero_oc)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const item of items) {
      // Buscar precio actualizado del material si no se proporciona o es cero
      let precio_unitario = item.precio_unitario;
      if (!precio_unitario || parseFloat(precio_unitario) === 0) {
        const precioQuery = await pool.query('SELECT precio_unitario FROM materiales WHERE codigo = $1 OR producto = $2', [item.codigo, item.producto]);
        precio_unitario = precioQuery.rows[0]?.precio_unitario || 0;
      }

      await pool.query(insertDetalle, [
        ordenId,
        item.codigo,
        item.producto,
        item.cantidad,
        precio_unitario,
        numero_oc
      ]);
    }

    res.status(201).json({ message: 'Orden de compra guardada con éxito', numero_oc });
  } catch (err) {
    console.error('❌ Error al guardar orden:', err.message);
    res.status(500).json({ error: 'Error al guardar la orden de compra' });
  }
});

app.get('/api/proveedores', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, proveedor AS nombre FROM proveedores ORDER BY proveedor');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener proveedores:', err.message);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

app.get('/api/materiales', async (req, res) => {
  try {
    const result = await pool.query('SELECT codigo, producto, precio_unitario FROM materiales ORDER BY producto');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener materiales:', err.message);
    res.status(500).json({ error: 'Error al consultar materiales' });
  }
});

app.get('/api/ultima_oc', async (req, res) => {
  try {
    const result = await pool.query('SELECT MAX(numero_oc::int) AS ultimo FROM detalle_oc');
    res.json({ ultimo: result.rows[0].ultimo });
  } catch (err) {
    console.error('Error al obtener último número OC:', err.message);
    res.status(500).json({ error: 'Error al obtener último número OC' });
  }
});
app.get('/api/precio-material', async (req, res) => {
  try {
    const { codigo } = req.query;

    if (!codigo) {
      return res.status(400).json({ error: 'Código requerido' });
    }

    const result = await pool.query(
      `SELECT precio_unitario
       FROM detalle_oc
       WHERE codigo = $1
       ORDER BY id DESC
       LIMIT 1`,
      [codigo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Precio no encontrado para este código' });
    }

    res.json({ precio_unitario: result.rows[0].precio_unitario });
  } catch (error) {
    console.error('❌ Error al obtener precio del material:', error.message);
    res.status(500).json({ error: 'Error al obtener precio del material' });
  }
});



app.listen(port, () => {
  console.log(`✅ Servidor backend escuchando en http://localhost:${port}`);
});
