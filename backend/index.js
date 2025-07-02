import express from 'express';
import pg from 'pg';
import fs from 'fs';
import cors from 'cors';

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());

// Configura la conexión a PostgreSQL
const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ASC',  // nombre exacto de tu base (verifica en pgAdmin)
  password: 'admin123',
  port: 5432,        // puerto por defecto
});

// Ruta para guardar cliente
app.post('/api/clientes', async (req, res) => {
  const { nombre, rut, correo, telefono, direccion } = req.body;

  // 1. Guardar respaldo en JSON
  const jsonPath = './respaldo_clientes.json';
  let respaldo = [];

  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath);
    respaldo = JSON.parse(raw);
  }

  respaldo.push({ nombre, rut, correo, telefono, direccion });
  fs.writeFileSync(jsonPath, JSON.stringify(respaldo, null, 2));

  // 2. Insertar en PostgreSQL
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

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
