import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 🔹 Agregar UTV
router.post('/utv', async (req, res) => {
  const { fecha, nombre_pauta, numero_pauta, tipo, cantidad_doble_corredera, cantidad_proyectante, cantidad_fijo, cantidad_oscilobatiente, cantidad_doble_corredera_fijo, cantidad_marco_puerta, cantidad_marcos_adicionales, comentario_marcos_adicionales, cantidad_otro, comentario_otro, valor_m2 } = req.body;

  try {
    await pool.query(`
      INSERT INTO utv_taller (
        fecha, nombre_pauta, numero_pauta, tipo,
        cantidad_doble_corredera, cantidad_proyectante, cantidad_fijo,
        cantidad_oscilobatiente, cantidad_doble_corredera_fijo,
        cantidad_marco_puerta, cantidad_marcos_adicionales, comentario_marcos_adicionales,
        cantidad_otro, comentario_otro, valor_m2
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    `, [
      fecha, nombre_pauta, numero_pauta, tipo,
      cantidad_doble_corredera, cantidad_proyectante, cantidad_fijo,
      cantidad_oscilobatiente, cantidad_doble_corredera_fijo,
      cantidad_marco_puerta, cantidad_marcos_adicionales, comentario_marcos_adicionales,
      cantidad_otro, comentario_otro, valor_m2
    ]);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error insertando UTV:', error);
    res.sendStatus(500);
  }
});

// 🔹 Agregar Termopanel
router.post('/termopanel', async (req, res) => {
  const { fecha, nombre_cliente, cantidad, ancho_mm, alto_mm, m2, observaciones, valor_m2 } = req.body;

  try {
    await pool.query(`
      INSERT INTO termopanel_taller (
        fecha, nombre_cliente, cantidad, ancho_mm, alto_mm, m2, observaciones, valor_m2
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [fecha, nombre_cliente, cantidad, ancho_mm, alto_mm, m2, observaciones, valor_m2]);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error insertando Termopanel:', error);
    res.sendStatus(500);
  }
});

// 🔹 Agregar Instalación
router.post('/instalacion', async (req, res) => {
  const { fecha, nombre_cliente, m2_rectificaciones, observaciones, valor_m2 } = req.body;

  try {
    await pool.query(`
      INSERT INTO instalaciones_taller (
        fecha, nombre_cliente, m2_rectificaciones, observaciones, valor_m2
      ) VALUES ($1,$2,$3,$4,$5)
    `, [fecha, nombre_cliente, m2_rectificaciones, observaciones, valor_m2]);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error insertando Instalación:', error);
    res.sendStatus(500);
  }
});

// 🔸 Obtener registros por mes/año
const generarFiltroFecha = (mes, anio) => {
  const start = `${anio}-${mes.toString().padStart(2, '0')}-01`;
  const end = `${anio}-${mes.toString().padStart(2, '0')}-31`;
  return [start, end];
};

router.get('/utv', async (req, res) => {
  const { mes, anio } = req.query;
  const [inicio, fin] = generarFiltroFecha(mes, anio);
  try {
    const resultado = await pool.query(`SELECT * FROM utv_taller WHERE fecha BETWEEN $1 AND $2`, [inicio, fin]);
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error obteniendo UTV:', err);
    res.sendStatus(500);
  }
});

router.get('/termopanel', async (req, res) => {
  const { mes, anio } = req.query;
  const [inicio, fin] = generarFiltroFecha(mes, anio);
  try {
    const resultado = await pool.query(`SELECT * FROM termopanel_taller WHERE fecha BETWEEN $1 AND $2`, [inicio, fin]);
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error obteniendo Termopanel:', err);
    res.sendStatus(500);
  }
});

router.get('/instalaciones', async (req, res) => {
  const { mes, anio } = req.query;
  const [inicio, fin] = generarFiltroFecha(mes, anio);
  try {
    const resultado = await pool.query(`SELECT * FROM instalaciones_taller WHERE fecha BETWEEN $1 AND $2`, [inicio, fin]);
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error obteniendo Instalaciones:', err);
    res.sendStatus(500);
  }
});

//Fechas

router.get('/', async (req, res) => {
  const { mes, anio } = req.query;

  try {
    const resultado = await pool.query(`
      SELECT * FROM utv 
      WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
    `, [mes, anio]);

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener datos UTV:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
