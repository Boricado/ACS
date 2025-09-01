import express from 'express';
import pg from 'pg';
import fs from 'fs';
import cors from 'cors';
import usuariosRoutes from './routes/usuarios.js'; // <- importante
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import resumenMaterialesRoutes from './routes/resumen_materiales.js';
import salidasRoutes from './routes/salidas.js';
import otPautasRoutes from './routes/ot_pautas.js';
import seguimientoRoutes from './routes/seguimiento.js';
import ajusteStockRoutes from './routes/ajuste_stock.js';
import proveedoresRoutes from './routes/proveedores.js';
import facturasGuiasRouter from './routes/facturasGuias.js';
import proveedoresCreditoRoutes from './routes/proveedores_credito.js';
import tallerRoutes from './routes/taller.js';
import trabajadoresRoutes from './routes/trabajadores.js';
import facturasEstadoRoutes from './routes/facturas_estado.js';

dotenv.config();

const app = express(); // <- esto debe ir antes de usar app

//
// Configura CORS para permitir tu frontend
const corsOptions = {
  origin: 'https://acs-indol-three.vercel.app',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Montar rutas después de definir `app`
app.use('/api', usuariosRoutes);
app.use('/api/resumen-materiales', resumenMaterialesRoutes);
app.use('/api', salidasRoutes);
app.use('/api/ot_pautas', otPautasRoutes);
app.use('/api/seguimiento_obras', seguimientoRoutes);
app.use('/api/ajuste_stock', ajusteStockRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/facturas_guias', facturasGuiasRouter);
app.use('/api/proveedores_credito', proveedoresCreditoRoutes);
app.use('/api/taller', tallerRoutes);
app.use('/api', trabajadoresRoutes); // expone /api/trabajadores
app.use('/api/facturas_estado', facturasEstadoRoutes);

// Configuración de conexión a PostgreSQL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Ruta base de prueba (opcional)
app.get('/', (req, res) => {
  res.send('API funcionando correctamente');
});

///////////////////////////

app.get('/ping', (req, res) => {
  res.status(200).send('Pong!');
});

//////////////////

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
  const { numero, cliente_id, nombre_obra, direccion, observacion, fecha, total_neto_presupuestado } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertPresupuestoQuery = `
      INSERT INTO presupuestos (numero, cliente_id, nombre_obra, direccion, observacion, fecha, total_neto_presupuestado)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const presupuestoValues = [
      numero || null,
      cliente_id || null,
      nombre_obra || null,
      direccion || null,
      observacion || null,
      fecha || new Date(),
      total_neto_presupuestado || 0
    ];

    const resultPresupuesto = await client.query(insertPresupuestoQuery, presupuestoValues);
    const presupuesto = resultPresupuesto.rows[0];

    // Obtener nombre del cliente desde la tabla clientes
    const clienteRes = await client.query('SELECT nombre FROM clientes WHERE id = $1', [cliente_id]);
    const cliente_nombre = clienteRes.rows[0]?.nombre || '';

    // Insertar en seguimiento_obras
    const insertSeguimientoQuery = `
      INSERT INTO seguimiento_obras (
        cliente_nombre, presupuesto_numero, nombre_obra, presupuesto,
        rectificacion, accesorios, gomas_cepillos, herraje, instalacion,
        perfiles, refuerzos, tornillos, vidrio, planilla_corte, fabricacion,
        acopio, despacho, recepcion_final, pago
      )
      VALUES ($1, $2, $3, true,
              false, false, false, false, false,
              false, false, false, false, false, false,
              false, false, false, false);
    `;
    const seguimientoValues = [
      cliente_nombre,
      numero,
      nombre_obra
    ];

    await client.query(insertSeguimientoQuery, seguimientoValues);

    await client.query('COMMIT');
    res.status(201).json(presupuesto);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al insertar presupuesto o seguimiento:', err.message);
    res.status(500).json({ error: 'Error al guardar presupuesto o seguimiento' });
  } finally {
    client.release();
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
// ✅ Crear una nueva orden de compra
app.post('/api/ordenes_compra', async (req, res) => {
  try {
    const {
      numero_oc,
      proveedor,
      fecha,
      realizado_por,
      comentario,
      cliente_id,            // Nombre del cliente (texto)
      numero_presupuesto,    // Número de presupuesto
      items
    } = req.body;

    // Insertar en ordenes_compra
    const insertOrden = `
      INSERT INTO ordenes_compra (
        numero_oc,
        proveedor,
        fecha,
        realizado_por,
        comentario,
        cliente_id,
        numero_presupuesto,
        estado_oc
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE')
      RETURNING numero_oc
    `;

    const valuesOrden = [
      numero_oc,
      proveedor,
      fecha,
      realizado_por,
      comentario,
      cliente_id,
      numero_presupuesto
    ];

    await pool.query(insertOrden, valuesOrden);

    // Insertar ítems en detalle_oc
    const insertDetalle = `
      INSERT INTO detalle_oc (
        codigo,
        producto,
        cantidad,
        precio_unitario,
        numero_oc,
        costo_neto,
        observacion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (const item of items) {
      await pool.query(insertDetalle, [
        item.codigo,
        item.producto,
        item.cantidad,
        item.precio_unitario,
        numero_oc,
        item.costo_neto || (item.cantidad * item.precio_unitario) || 0,
        item.observacion || ''
      ]);
    }

    res.status(201).json({ message: 'Orden de compra guardada con éxito', numero_oc });
  } catch (err) {
    console.error('❌ Error al guardar orden de compra:', err.message);
    res.status(500).json({ error: 'Error al guardar la orden de compra' });
  }
});


// ✅ Obtener todas las órdenes de compra (para editar o listar)
app.get('/api/ordenes_compra', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        numero_oc,
        proveedor,
        cliente_id,
        numero_presupuesto
      FROM ordenes_compra
      ORDER BY numero_oc DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener órdenes de compra:', error.message);
    res.status(500).json({ error: 'Error al obtener órdenes de compra' });
  }
});




// GET: Obtener materiales
app.get('/api/materiales', async (req, res) => {
  try {
    const result = await pool.query('SELECT codigo, producto, precio_unitario FROM materiales ORDER BY producto');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener materiales:', err.message);
    res.status(500).json({ error: 'Error al consultar materiales' });
  }
});

// POST: Crear nuevo material y agregarlo también al inventario
app.post('/api/materiales', async (req, res) => {
  const { codigo, producto } = req.body;

  const medida = 'UNIDAD';
  const stock_min = 0;
  const stock_actual = 0;

  try {
    // 1. Insertar en tabla materiales
    await pool.query(
      'INSERT INTO materiales (codigo, producto, medida, stock_min) VALUES ($1, $2, $3, $4)',
      [codigo.trim(), producto.trim(), medida, stock_min]
    );

    // 2. Insertar en tabla inventario (solo si no existe)
    await pool.query(
      `INSERT INTO inventario (codigo, stock_actual, stock_minimo, unidad)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (codigo) DO NOTHING`,
      [codigo.trim(), stock_actual, stock_min, medida]
    );

    res.status(201).json({ mensaje: 'Material y stock creado correctamente' });

  } catch (err) {
    console.error('Error al crear/actualizar material:', err.message);
    res.status(500).json({ error: 'Error al crear material' });
  }
});

// PUT: Actualizar nombre de material (y sincronizar inventario)
app.put('/api/materiales/:codigo', async (req, res) => {
  const { codigo } = req.params;
  const { producto } = req.body;

  const nuevoNombre = (producto || '').trim();
  if (!codigo) return res.status(400).json({ error: 'Falta el código' });
  if (!nuevoNombre) return res.status(400).json({ error: 'El nombre de producto no puede estar vacío' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Actualiza materiales (fuente de verdad)
    const updMat = await client.query(
      `UPDATE materiales
       SET producto = $1
       WHERE codigo = $2
       RETURNING codigo, producto`,
      [nuevoNombre, codigo]
    );

    if (updMat.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    // 2) (Opcional) Mantener inventario sincronizado si ahí también guardas el nombre
    await client.query(
      `UPDATE inventario
       SET producto = $1
       WHERE codigo = $2`,
      [nuevoNombre, codigo]
    );

    await client.query('COMMIT');
    return res.json({ mensaje: 'Nombre actualizado', material: updMat.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error al actualizar material:', err);
    return res.status(500).json({ error: 'Error interno al actualizar material' });
  } finally {
    client.release();
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
//////////////////

app.get('/api/items_oc/:numero_oc', async (req, res) => {
  try {
    const { numero_oc } = req.params;
    const result = await pool.query(
      'SELECT * FROM detalle_oc WHERE numero_oc = $1 ORDER BY id ASC',
      [numero_oc]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ítems OC:', error.message);
    res.status(500).json({ error: 'Error al obtener ítems de OC' });
  }
});
app.post('/api/items_oc', async (req, res) => {
  try {
    const { codigo, producto, cantidad, precio_unitario, numero_oc } = req.body;
    const costo_neto = (parseInt(cantidad) || 0) * (parseInt(precio_unitario) || 0);

    const result = await pool.query(
      `INSERT INTO detalle_oc (codigo, producto, cantidad, precio_unitario, numero_oc, costo_neto)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [codigo, producto, cantidad, precio_unitario, numero_oc, costo_neto]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al agregar ítem OC:', error.message);
    res.status(500).json({ error: 'Error al agregar ítem de OC' });
  }
});
app.put('/api/items_oc/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, producto, cantidad, precio_unitario } = req.body;
    const costo_neto = (parseInt(cantidad) || 0) * (parseInt(precio_unitario) || 0);

    const result = await pool.query(
      `UPDATE detalle_oc
       SET codigo = $1, producto = $2, cantidad = $3, precio_unitario = $4, costo_neto = $5
       WHERE id = $6
       RETURNING *`,
      [codigo, producto, cantidad, precio_unitario, costo_neto, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar ítem OC:', error.message);
    res.status(500).json({ error: 'Error al actualizar ítem de OC' });
  }
});
app.delete('/api/items_oc/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM detalle_oc WHERE id = $1', [id]);
    res.json({ message: 'Ítem eliminado' });
  } catch (error) {
    console.error('Error al eliminar ítem OC:', error.message);
    res.status(500).json({ error: 'Error al eliminar ítem de OC' });
  }
});

// Actualizar el comentario de una orden de compra
app.put('/api/ordenes_compra/:numero_oc', async (req, res) => {
  try {
    const { numero_oc } = req.params;
    const { comentario } = req.body;

    const updateQuery = `
      UPDATE ordenes_compra
      SET comentario = $1
      WHERE numero_oc = $2
    `;

    await pool.query(updateQuery, [comentario, numero_oc]);

    res.status(200).json({ message: 'Comentario actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar comentario:', error.message);
    res.status(500).json({ error: 'Error al actualizar el comentario de la orden de compra' });
  }
});

app.get('/api/ordenes_compra_estado', async (req, res) => {
  const { estado } = req.query;

  try {
    let ordenesQuery = `
      SELECT 
        oc.numero_oc,
        TO_CHAR(oc.fecha, 'DD-MM-YYYY') AS fecha,
        oc.proveedor,
        oc.numero_presupuesto,
        oc.cliente_id,
        oc.estado_oc,
        oc.factura,
        oc.fecha_factura,
        COALESCE(MAX(doc.observacion), '') AS observacion,
        SUM(doc.cantidad * doc.precio_unitario) AS total_neto
      FROM ordenes_compra oc
      LEFT JOIN detalle_oc doc ON doc.numero_oc = oc.numero_oc
    `;

    const condiciones = [];
    const valores = [];

    if (estado && estado !== 'Todas') {
      condiciones.push(`UPPER(oc.estado_oc) = $${valores.length + 1}`);
      valores.push(estado.toUpperCase());
    }

    if (condiciones.length > 0) {
      ordenesQuery += ` WHERE ` + condiciones.join(' AND ');
    }

    ordenesQuery += `
      GROUP BY 
        oc.numero_oc,
        oc.fecha,
        oc.proveedor,
        oc.numero_presupuesto,
        oc.cliente_id,
        oc.estado_oc,
        oc.factura,
        oc.fecha_factura
      ORDER BY oc.fecha DESC
    `;

    const ordenesRes = await pool.query(ordenesQuery, valores);
    const ordenes = ordenesRes.rows;

    // === ÚNICO CAMBIO AQUÍ: incluir observacion_ingreso en los detalles ===
    for (const orden of ordenes) {
      const detallesRes = await pool.query(
        `
        SELECT 
          id,
          codigo, 
          producto, 
          cantidad, 
          precio_unitario, 
          cantidad_llegada,
          COALESCE(observacion_ingreso, '') AS observacion_ingreso
        FROM detalle_oc
        WHERE numero_oc = $1
        ORDER BY id ASC
        `,
        [orden.numero_oc]
      );

      orden.detalles = detallesRes.rows;
    }

    res.json(ordenes);
  } catch (error) {
    console.error('❌ Error al obtener órdenes por estado:', error.message);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});


// ✅ Detalle de una OC por número: /api/ordenes_compra/:numero_oc
app.get('/api/ordenes_compra/:numero_oc', async (req, res) => {
  const { numero_oc } = req.params;

  try {
    const query = `
      SELECT
        oc.numero_oc,
        TO_CHAR(oc.fecha, 'YYYY-MM-DD') AS fecha,
        oc.proveedor,
        oc.realizado_por,
        oc.comentario,
        oc.numero_presupuesto,
        -- Cliente: si guardaste el nombre en oc.cliente_id, lo respeta; si es id, lo resuelve
        COALESCE(c.nombre, oc.cliente_id) AS cliente_nombre,
        -- Datos proveedor desde catálogo
        p.rut AS rut_proveedor,
        p.banco,
        p.numero_cuenta
      FROM ordenes_compra oc
      LEFT JOIN proveedores p
        ON UPPER(TRIM(p.proveedor)) = UPPER(TRIM(oc.proveedor))
      LEFT JOIN clientes c
        ON c.id::text = oc.cliente_id
        OR UPPER(TRIM(c.nombre)) = UPPER(TRIM(oc.cliente_id))
      WHERE oc.numero_oc = $1
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [numero_oc]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Error al obtener detalle OC:', error.message);
    res.status(500).json({ error: 'Error al obtener detalle de la orden de compra' });
  }
});


///////////////

app.get('/api/inventario', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT DISTINCT ON (i.codigo)
        i.codigo,
        -- 👇 PRIORIDAD: materiales.producto; si no hay, usa el de la última OC
        COALESCE(m.producto, d.producto, '') AS producto,
        i.stock_actual,
        i.stock_minimo,
        i.unidad,
        COALESCE(d.precio_unitario, 0) AS precio_unitario
      FROM inventario i
      -- nombre oficial desde materiales
      LEFT JOIN materiales m ON m.codigo = i.codigo
      -- último precio/nombre según última OC
      LEFT JOIN detalle_oc d ON i.codigo = d.codigo
      LEFT JOIN ordenes_compra oc ON d.numero_oc = oc.numero_oc
      -- 👇 importante para que d.* sea la última compra
      ORDER BY i.codigo, oc.fecha DESC NULLS LAST, d.id DESC NULLS LAST
    `);

    const inventarioBase = resultado.rows;

    // Stock reservado (obras activas)
    const reservadoQuery = await pool.query(`
      SELECT codigo, SUM(cantidad) AS total_reservado
      FROM (
        SELECT codigo, cantidad, numero_presupuesto FROM ot_pautas_perfiles
        UNION ALL
        SELECT codigo, cantidad, numero_presupuesto FROM ot_pautas_refuerzos
        UNION ALL
        SELECT codigo, cantidad, numero_presupuesto FROM ot_pautas_tornillos
        UNION ALL
        SELECT codigo, cantidad, numero_presupuesto FROM ot_pautas_herraje
        UNION ALL
        SELECT codigo, cantidad, numero_presupuesto FROM ot_pautas_accesorios
        UNION ALL
        SELECT codigo, cantidad, numero_presupuesto FROM ot_pautas_gomascepillos
        UNION ALL
        SELECT codigo, cantidad, numero_presupuesto FROM ot_pautas_vidrio
        UNION ALL
        SELECT codigo, cantidad, numero_presupuesto FROM ot_pautas_instalacion
      ) AS pautas
      WHERE numero_presupuesto IN (
        SELECT presupuesto_numero FROM seguimiento_obras WHERE recepcion_final = false
      )
      GROUP BY codigo
    `);

    const stockReservadoMap = {};
    reservadoQuery.rows.forEach(row => {
      stockReservadoMap[row.codigo] = parseInt(row.total_reservado) || 0;
    });

    const inventarioFinal = inventarioBase.map(item => {
      const reservado = stockReservadoMap[item.codigo] || 0;
      const disponible = (item.stock_actual || 0) - reservado;
      return {
        ...item,
        stock_reservado: reservado,
        stock_disponible: disponible
      };
    });

    res.json(inventarioFinal);
  } catch (err) {
    console.error('❌ ERROR en /api/inventario:', err.message);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});



app.get('/api/reservas_activas/:codigo', async (req, res) => {
  const { codigo } = req.params;
  try {
    const tablas = [
      'ot_pautas_perfiles',
      'ot_pautas_refuerzos',
      'ot_pautas_tornillos',
      'ot_pautas_herraje',
      'ot_pautas_accesorios',
      'ot_pautas_gomascepillos',
      'ot_pautas_vidrio',
      'ot_pautas_instalacion'
    ];

    const reservas = [];

    for (const tabla of tablas) {
      const result = await pool.query(`
        SELECT p.cliente_id, p.presupuesto_id, p.numero_presupuesto, p.codigo, p.producto, p.cantidad,
               s.nombre_obra, s.cliente_nombre
        FROM ${tabla} p
        INNER JOIN seguimiento_obras s
        ON p.numero_presupuesto = s.presupuesto_numero
        WHERE p.codigo = $1 AND s.recepcion_final = false
      `, [codigo]);

      reservas.push(...result.rows);
    }

    res.json(reservas);
  } catch (error) {
    console.error('❌ Error al obtener reservas activas por código:', error);
    res.status(500).json({ error: 'Error al obtener reservas activas' });
  }
});



/////////////////

// -----------------------------
// INGRESAR FACTURA  (con observacion_ingreso por ítem)
// -----------------------------
app.post('/api/ingresar_factura', async (req, res) => {
  const { ordenes = [] } = req.body;
  const client = await pool.connect();

  if (!Array.isArray(ordenes) || ordenes.length === 0) {
    return res.status(400).json({ error: 'No se recibieron órdenes para procesar.' });
  }

  try {
    await client.query('BEGIN');

    for (const orden of ordenes) {
      const numero_oc = orden.numero_oc;
      if (!numero_oc) throw new Error('Falta numero_oc en la orden.');

      // 1) Actualiza líneas de detalle (incluye observacion_ingreso)
      for (const detalle of orden.detalles || []) {
        const {
          id,
          codigo,
          cantidad_llegada = 0,
          precio_unitario = 0,
          observacion_ingreso = '' // 👈 viene del front
        } = detalle;

        if (!codigo) throw new Error(`Falta código en detalle de OC ${numero_oc}`);

        const costo_neto = (Number(cantidad_llegada) || 0) * (Number(precio_unitario) || 0);

        await client.query(
          `UPDATE detalle_oc
             SET cantidad_llegada   = $1,
                 precio_unitario    = $2,
                 costo_neto         = $3,
                 observacion_ingreso= $4   -- 👈 guarda aquí
           WHERE numero_oc = $5 AND codigo = $6 AND id = $7`,
          [
            Number(cantidad_llegada) || 0,
            Number(precio_unitario) || 0,
            Number(costo_neto) || 0,
            String(observacion_ingreso || ''),
            numero_oc,
            codigo,
            id
          ]
        );

        // 2) Actualiza stock si hubo llegada
        if ((Number(cantidad_llegada) || 0) > 0) {
          await client.query(
            `UPDATE inventario
                SET stock_actual = stock_actual + $1
              WHERE codigo = $2`,
            [Number(cantidad_llegada) || 0, codigo]
          );
        }
      }

      // 3) Actualiza cabecera de la OC (factura y fecha)
      await client.query(
        `UPDATE ordenes_compra
            SET factura = $1,
                fecha_factura = $2
          WHERE numero_oc = $3`,
        [orden.factura || null, orden.fecha_factura || null, numero_oc]
      );

      // 4) Si no quedan pendientes, marca la OC como Completa
      const result = await client.query(
        `SELECT COUNT(*) FROM detalle_oc
          WHERE numero_oc = $1
            AND (cantidad_llegada IS NULL OR cantidad_llegada < cantidad)`,
        [numero_oc]
      );

      if (parseInt(result.rows[0].count, 10) === 0) {
        await client.query(
          `UPDATE ordenes_compra
              SET estado_oc = 'Completa'
            WHERE numero_oc = $1`,
          [numero_oc]
        );
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Factura ingresada correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al ingresar factura:', error);
    res.status(500).json({ error: 'Error al ingresar factura' });
  } finally {
    client.release();
  }
});


////////////////////
app.post('/api/salidas_stock', async (req, res) => {
  const { numero_oc, codigo, cantidad_salida } = req.body;

  try {
    const result = await pool.query(`
      UPDATE detalle_oc
      SET salidas_stock = COALESCE(salidas_stock, 0) + $1
      WHERE numero_oc = $2 AND codigo = $3
      RETURNING *;
    `, [cantidad_salida, numero_oc, codigo]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No se encontró el ítem de OC' });
    }

    res.json({ message: 'Salida registrada con éxito', item: result.rows[0] });
  } catch (err) {
    console.error('Error al registrar salida de stock:', err.message);
    res.status(500).json({ error: 'Error al registrar salida de stock' });
  }
});
///////////////////////

// -----------------------------
// REGISTRAR SALIDA DE MATERIAL
// -----------------------------
app.post('/api/registro_salida', async (req, res) => {
  const {
    codigo,
    producto,
    cantidad_salida,
    cliente_id,
    presupuesto_id,
    cliente_nombre,
    presupuesto_numero,
    nombre_obra,
    precio_unitario,
    observacion
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const salida = parseInt(cantidad_salida);
    const precio = parseInt(precio_unitario);
    const clienteId = parseInt(cliente_id);
    const presupuestoId = parseInt(presupuesto_id);

    // Verificar si ya existe un registro previo en registro_obras
    const check = await client.query(`
      SELECT id FROM registro_obras
      WHERE cliente_id = $1 AND presupuesto_id = $2 AND codigo = $3
    `, [clienteId, presupuestoId, codigo]);

    if (check.rows.length > 0) {
      // Ya existe: actualizar cantidad_salidas
      await client.query(`
        UPDATE registro_obras
        SET cantidad_salidas = cantidad_salidas + $1
        WHERE cliente_id = $2 AND presupuesto_id = $3 AND codigo = $4
      `, [salida, clienteId, presupuestoId, codigo]);
    } else {
      // Obtener cantidad presupuestada desde items_presupuesto
      const result = await client.query(`
        SELECT cantidad FROM items_presupuesto
        WHERE presupuesto_id = $1 AND item = $2
        LIMIT 1
      `, [presupuestoId, producto]);

      const cantidad_presupuestada = parseInt(result.rows[0]?.cantidad || 0);

      // Insertar nuevo registro completo en registro_obras
      await client.query(`
        INSERT INTO registro_obras (
          cliente_id, presupuesto_id, cliente_nombre, presupuesto_numero,
          nombre_obra, codigo, producto, cantidad_presupuestada,
          cantidad_salidas, precio_unitario, observacion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        clienteId,
        presupuestoId,
        cliente_nombre,
        presupuesto_numero,
        nombre_obra,
        codigo,
        producto,
        cantidad_presupuestada,
        salida,
        precio,
        observacion || ''
      ]);
    }

    // 🟢 Registrar salida en historial
    await client.query(`
      INSERT INTO salidas_inventario2 (
        cliente_nombre, presupuesto_numero, nombre_obra,
        codigo, producto, cantidad, precio_neto, fecha
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
    `, [
      cliente_nombre,
      presupuesto_numero,
      nombre_obra,
      codigo,
      producto,
      salida,
      salida * precio
    ]);

    // 🟢 Descontar del stock_actual en inventario
    await client.query(`
      UPDATE inventario
      SET stock_actual = stock_actual - $1
      WHERE codigo = $2
    `, [salida, codigo]);

    // 🟢 Actualizar salidas_stock en detalle_oc
    await client.query(`
      UPDATE detalle_oc
      SET salidas_stock = COALESCE(salidas_stock, 0) + $1
      WHERE codigo = $2
    `, [salida, codigo]);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Salida registrada correctamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en /api/registro_salida:', error.message);
    res.status(500).json({ error: 'Error al registrar salida' });
  } finally {
    client.release();
  }
});



//////////////////////////////

// ------------------------------
// RUTA: Obtener seguimiento obras
// ------------------------------
app.get('/api/seguimiento_obras', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM seguimiento_obras ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener seguimiento:', err.message);
    res.status(500).json({ error: 'Error al obtener seguimiento' });
  }
});

// ------------------------------
// RUTA: Actualizar comentario obra
// ------------------------------
app.put('/api/seguimiento_obras/:id/comentario', async (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;

  try {
    await pool.query('UPDATE seguimiento_obras SET comentario = $1 WHERE id = $2', [comentario, id]);
    res.status(200).json({ message: 'Comentario actualizado correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar comentario:', err.message);
    res.status(500).json({ error: 'Error al actualizar comentario' });
  }
});

///////////

app.post('/api/seguimiento_obras', async (req, res) => {
  const {
    cliente_nombre,
    presupuesto_numero,
    nombre_obra
  } = req.body;

  try {
    await pool.query(`
      INSERT INTO seguimiento_obras (
        cliente_nombre, presupuesto_numero, nombre_obra,
        presupuesto, rectificacion, accesorios, gomas_cepillos,
        herraje, instalacion, perfiles, refuerzos, tornillos,
        vidrio, planilla_corte, fabricacion, acopio, despacho,
        recepcion_final, pago, comentario
      ) VALUES (
        $1, $2, $3,
        true, false, false, false,
        false, false, false, false, false,
        false, false, false, false, false,
        false, false, ''
      )
    `, [cliente_nombre, presupuesto_numero, nombre_obra]);

    res.status(200).json({ message: 'Seguimiento creado correctamente' });
  } catch (error) {
    console.error('❌ Error creando seguimiento:', error.message);
    res.status(500).json({ error: 'Error al crear seguimiento' });
  }
});


app.get('/api/presupuestos/numero/:numero', async (req, res) => {
  const { numero } = req.params;
  try {
    const result = await pool.query('SELECT 1 FROM presupuestos WHERE numero = $1', [numero]);
    res.json({ existe: result.rowCount > 0 });
  } catch (err) {
    console.error('Error al verificar número de presupuesto:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// BACKEND - Express: Registrar stock reservado
app.post('/api/ot_stock_reservado', async (req, res) => {
  const {
    cliente_id,
    cliente_nombre,
    presupuesto_id,
    presupuesto_numero,
    nombre_obra,
    codigo,
    producto,
    cantidad,
    observacion
  } = req.body;

  try {
    await pool.query(`
      INSERT INTO ot_stock_reservado (
        cliente_id, cliente_nombre,
        presupuesto_id, presupuesto_numero, nombre_obra,
        codigo, producto, cantidad, observacion
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [
      cliente_id, cliente_nombre,
      presupuesto_id, presupuesto_numero, nombre_obra,
      codigo, producto, cantidad, observacion
    ]);

    res.status(200).json({ message: 'Stock reservado correctamente' });
  } catch (error) {
    console.error('❌ Error al reservar stock:', error.message);
    res.status(500).json({ error: 'Error al guardar reserva de stock' });
  }
});

// Backend dinámico para guardar materiales en tablas ot_pautas_<categoria>
app.post('/api/ot_pautas/:categoria', async (req, res) => {
  const { categoria } = req.params;
  const tabla = `ot_pautas_${categoria.toLowerCase()}`; // ejemplo: ot_pautas_perfiles

  const {  cliente_id, presupuesto_id, numero_presupuesto, codigo, producto, cantidad } = req.body;

  const columnasValidas = ['perfiles', 'refuerzos', 'herraje', 'accesorios', 'gomascepillos', 'tornillos', 'vidrio', 'instalacion'];
  if (!columnasValidas.includes(categoria.toLowerCase())) {
    return res.status(400).json({ error: 'Categoría no válida' });
  }

  try {
    await pool.query(`
      INSERT INTO ${tabla} (cliente_id, presupuesto_id, numero_presupuesto, codigo, producto, cantidad)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [cliente_id, presupuesto_id, numero_presupuesto, codigo, producto, cantidad]);

    res.status(200).json({ message: `Datos guardados en ${tabla}` });
  } catch (err) {
    console.error('❌ Error al guardar pauta:', err.message);
    res.status(500).json({ error: 'Error al guardar pauta' });
  }
});

// GET dinámico para obtener materiales por cliente y presupuesto
app.get('/api/ot_pautas/:categoria', async (req, res) => {
  const { categoria } = req.params;
  const { cliente_id, presupuesto_id } = req.query;

  const tablasPermitidas = [
    'perfiles',
    'refuerzos',
    'herraje',
    'accesorios',
    'gomascepillos',
    'tornillos',
    'vidrio',
    'instalacion'
  ];

  if (!tablasPermitidas.includes(categoria.toLowerCase())) {
    return res.status(400).json({ error: 'Categoría no permitida' });
  }

  const tabla = `ot_pautas_${categoria.toLowerCase()}`;

  try {
    const resultado = await pool.query(
      `SELECT * FROM ${tabla} WHERE cliente_id = $1 AND presupuesto_id = $2 ORDER BY id ASC`,
      [cliente_id, presupuesto_id]
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error('❌ Error al obtener pautas:', err.message);
    res.status(500).json({ error: 'Error interno al obtener pautas' });
  }
});


app.delete('/api/ot_pautas/:categoria/:id', async (req, res) => {
  const { categoria, id } = req.params;
  const tabla = `ot_pautas_${categoria.toLowerCase()}`;
  try {
    await pool.query(`DELETE FROM ${tabla} WHERE id = $1`, [id]);
    res.status(200).json({ message: 'Material eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar material:', err.message);
    res.status(500).json({ error: 'Error interno al eliminar material' });
  }
});

///////////////////
//app.use('/api/ot_pautas', otPautasRoutes);

// Obtener cliente por ID
app.get('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener cliente por ID:', error.message);
    res.status(500).json({ error: 'Error al consultar cliente' });
  }
});

// Obtener presupuesto por ID
app.get('/api/presupuestos/id/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM presupuestos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener presupuesto por ID:', error.message);
    res.status(500).json({ error: 'Error al consultar presupuesto' });
  }
});


// Verificar cliente por ID
app.get('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener cliente por ID:', err.message);
    res.status(500).json({ error: 'Error al consultar cliente' });
  }
});

// Verificar presupuesto por ID
app.get('/api/presupuestos/id/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM presupuestos WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener presupuesto por ID:', err.message);
    res.status(500).json({ error: 'Error al consultar presupuesto' });
  }
});

///////////////////StockReservado

// PATCH /api/stock-reservado/:tabla/:id
app.patch('/api/stock-reservado/:tabla/:id', async (req, res) => {
  const { tabla, id } = req.params;
  const { separado } = req.body;

  // Lista blanca para evitar inyecciones SQL
  const tablasPermitidas = [
    'ot_pautas_perfiles', 'ot_pautas_refuerzos', 'ot_pautas_tornillos',
    'ot_pautas_herraje', 'ot_pautas_accesorios', 'ot_pautas_gomascepillos',
    'ot_pautas_vidrio', 'ot_pautas_instalacion'
  ];

  if (!tablasPermitidas.includes(tabla)) {
    return res.status(400).json({ error: 'Tabla no permitida' });
  }

  try {
    const query = `UPDATE ${tabla} SET separado = $1 WHERE id = $2`;
    await pool.query(query, [separado, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar separado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// ---------------------
// Rutas para Pautas OT
// ---------------------

app.get('/api/ot_pautas_perfiles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ot_pautas_perfiles');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfiles' });
  }
});

app.get('/api/ot_pautas_refuerzos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ot_pautas_refuerzos');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener refuerzos' });
  }
});

app.get('/api/ot_pautas_tornillos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ot_pautas_tornillos');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tornillos' });
  }
});

app.get('/api/ot_pautas_herraje', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ot_pautas_herraje');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener herraje' });
  }
});

app.get('/api/ot_pautas_accesorios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ot_pautas_accesorios');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener accesorios' });
  }
});

app.get('/api/ot_pautas_gomascepillos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ot_pautas_gomascepillos');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener gomas y cepillos' });
  }
});

app.get('/api/ot_pautas_vidrio', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ot_pautas_vidrio');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener vidrios' });
  }
});

app.get('/api/ot_pautas_instalacion', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ot_pautas_instalacion');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener instalación' });
  }
});

//////////////// Solicitudes de Bodega

// -----------------------------
// Solicitudes de Bodega
// -----------------------------
app.post('/api/solicitudes', async (req, res) => {
  const { codigo, producto, cantidad, solicitante } = req.body;

  const fecha_creacion = new Date().toISOString().split('T')[0];
  const estado = 'Pendiente';

  try {
    await pool.query(
      `INSERT INTO solicitudes (codigo, producto, cantidad, solicitante, estado, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [codigo, producto, cantidad, solicitante, estado, fecha_creacion]
    );
    res.status(201).json({ mensaje: 'Solicitud creada' });
  } catch (err) {
    console.error('❌ Error al guardar solicitud:', err);
    res.status(500).json({ error: 'Error al guardar solicitud' });
  }
});

app.post('/api/solicitudes', async (req, res) => {
  const { codigo, producto, cantidad, solicitante } = req.body;
  const fecha_creacion = new Date(); // ← fecha actual
  const estado = 'Pendiente';
  const aprobada = false;

  try {
    await pool.query(
      'INSERT INTO solicitudes (codigo, producto, cantidad, solicitante, fecha_creacion, estado, aprobada) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [codigo, producto, cantidad, solicitante, fecha_creacion, estado, aprobada]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error('❌ Error al guardar solicitud:', err);
    res.status(500).json({ error: 'Error al guardar solicitud' });
  }
});


// Ruta para actualizar el estado de la solicitud
app.put('/api/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  const { aprobada } = req.body;

  const nuevoEstado = aprobada ? 'Aprobado' : 'Pendiente';
  const fechaAprobacion = aprobada ? new Date() : null;

  try {
    await pool.query(
      'UPDATE solicitudes SET aprobada = $1, estado = $2, fecha_aprobacion = $3 WHERE id = $4',
      [aprobada, nuevoEstado, fechaAprobacion, id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error al actualizar solicitud:', err);
    res.status(500).json({ error: 'Error al actualizar solicitud' });
  }
});

// Ruta para obtener todas las solicitudes
app.get('/api/solicitudes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM solicitudes ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener solicitudes:', err);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

//////////////////////////

// ----------------------------
// RUTA: LOGIN DE USUARIO
// ----------------------------
app.post('/api/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 AND activo = true',
      [correo]
    );

    const usuario = result.rows[0];
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    const valid = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!valid) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET || 'clave_secreta',
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// ----------------------------
// RUTA: CAMBIAR CONTRASEÑA
// ----------------------------
app.put('/api/usuarios/:id/cambiar-contrasena', async (req, res) => {
  const { id } = req.params;
  const { nuevaContrasena } = req.body;

  if (!nuevaContrasena || nuevaContrasena.length < 6) {
    return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const hash = await bcrypt.hash(nuevaContrasena, 10);
    await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id = $2', [hash, id]);
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});



// Puerto de escucha
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`✅ Servidor backend escuchando en http://localhost:${port}`);
});