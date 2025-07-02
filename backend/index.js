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

// ----------------------
// Ruta: Guardar Cliente
// ----------------------
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

// ----------------------
// Ruta: Obtener todos los clientes
// ----------------------
app.get('/api/clientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener clientes:', err.message);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// ----------------------
// Ruta: Guardar Presupuesto
// ----------------------
app.post('/api/presupuestos', async (req, res) => {
  const {
    numero,
    cliente_id,
    nombre_obra,
    direccion,
    observacion,
    fecha
  } = req.body;

  try {
    const query = `
      INSERT INTO presupuestos (
        numero, cliente_id, nombre_obra,
        direccion, observacion, fecha
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6
      ) RETURNING *;
    `;

    const values = [
      numero || null,
      cliente_id || null,
      nombre_obra || null,
      direccion || null,
      observacion || null,
      fecha || new Date()
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al insertar presupuesto:', err.message);
    res.status(500).json({ error: 'Error al guardar presupuesto' });
  }
});

// ----------------------
// Ruta: Guardar Ítem de Presupuesto
// ----------------------
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
    case 'Proyectante':
    case 'Oscilobatiente':
    case 'Doble Corredera':
    case 'Otro':
    default: base_utv = 1; break;
  }

  const adicionales = adicional ? (cuadros_adicionales || 0) * 0.5 : 0;
  const utv = observaciones ? 0 : base_utv + adicionales;
  const valorUTV = 20000;
  const utv_monto = utv * valorUTV;
  const total = (cantidad ?? 0) * (precio_unitario ?? 0);

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
      presupuesto_id || null,
      item || null,
      recinto || null,
      ancho || null,
      alto || null,
      tipo_apertura || null,
      grada_buque ?? false,
      observaciones ?? false,
      cantidad ?? 0,
      precio_unitario ?? 0,
      tipo_ventana || null,
      cuadros_adicionales ?? 0,
      utv ?? 0,
      utv_monto ?? 0,
      texto_observaciones || null,
      adicional ?? false
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al insertar ítem:', err.message);
    res.status(500).json({ error: 'Error al guardar en la base de datos' });
  }
});

// ----------------------
// Ruta: Obtener ítems por presupuesto
// ----------------------
app.get('/api/items_presupuesto/:presupuesto_id', async (req, res) => {
  const { presupuesto_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM items_presupuesto WHERE presupuesto_id = $1 ORDER BY id',
      [presupuesto_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener ítems:', err.message);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// ----------------------
// Servidor
// ----------------------
app.listen(port, () => {
  console.log(`✅ Servidor backend escuchando en http://localhost:${port}`);
});
