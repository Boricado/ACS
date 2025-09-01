import express from 'express';
import pool from '../db.js';

const router = express.Router();

/** =========================
 * Helpers de fecha (seguros)
 * ========================= */
const boundsMes = (mesQ, anioQ) => {
  const hoy = new Date();
  const anio = Number(anioQ) || hoy.getFullYear();
  const mes  = Number(mesQ)  || (hoy.getMonth() + 1); // 1-12

  // Primer día del mes (UTC para evitar desfases TZ)
  const inicio = new Date(Date.UTC(anio, mes - 1, 1));
  // Primer día del mes siguiente
  const fin    = new Date(Date.UTC(anio, mes, 1));

  const toISO = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD
  return [toISO(inicio), toISO(fin)];
};

/** =========================
 * UTV: CRUD
 * ========================= */

// POST /api/taller/utv
router.post('/utv', async (req, res) => {
  const {
    fecha,
    nombre_pauta,
    numero_pauta,
    tipo,
    doble_corredera,
    proyectante,
    fijo,
    oscilobatiente,
    doble_corredera_fijo,
    marco_puerta,
    marcos_adicionales,
    comentario_marcos,
    otro,
    comentario_otro,
    valor_m2,
    fijo_mas_corredera,
    m2_instalador,
    instalador
  } = req.body;

  try {
    await pool.query(`
      INSERT INTO utv_taller (
        fecha,
        nombre_pauta,
        numero_pauta,
        tipo,
        doble_corredera,
        proyectante,
        fijo,
        oscilobatiente,
        doble_corredera_fijo,
        marco_puerta,
        marcos_adicionales,
        comentario_marcos,
        otro,
        comentario_otro,
        valor_m2,
        fijo_mas_corredera,
        m2_instalador,
        instalador
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18
      )
    `, [
      fecha,
      nombre_pauta,
      numero_pauta,
      tipo,
      doble_corredera,
      proyectante,
      fijo,
      oscilobatiente,
      doble_corredera_fijo,
      marco_puerta,
      marcos_adicionales,
      comentario_marcos,
      otro,
      comentario_otro,
      valor_m2,
      fijo_mas_corredera,
      m2_instalador,
      instalador
    ]);

    res.status(201).json({ message: 'Registro de UTV guardado con éxito' });
  } catch (error) {
    console.error('Error al registrar UTV:', error);
    res.status(500).json({ error: 'Error al registrar UTV' });
  }
});

// PUT /api/taller/utv/:id
router.put('/utv/:id', async (req, res) => {
  const {
    fecha,
    nombre_pauta,
    numero_pauta,
    tipo,
    fijo,
    fijo_mas_corredera,
    proyectante,
    oscilobatiente,
    doble_corredera,
    doble_corredera_fijo,
    marco_puerta,
    marcos_adicionales,
    comentario_marcos,
    otro,
    comentario_otro,
    valor_m2,
    m2_instalador,
    instalador
  } = req.body;

  try {
    await pool.query(`
      UPDATE utv_taller SET
        fecha = $1,
        nombre_pauta = $2,
        numero_pauta = $3,
        tipo = $4,
        fijo = $5,
        fijo_mas_corredera = $6,
        proyectante = $7,
        oscilobatiente = $8,
        doble_corredera = $9,
        doble_corredera_fijo = $10,
        marco_puerta = $11,
        marcos_adicionales = $12,
        comentario_marcos = $13,
        otro = $14,
        comentario_otro = $15,
        valor_m2 = $16,
        m2_instalador = $17,
        instalador = $18
      WHERE id = $19
    `, [
      fecha,
      nombre_pauta,
      numero_pauta,
      tipo,
      fijo,
      fijo_mas_corredera,
      proyectante,
      oscilobatiente,
      doble_corredera,
      doble_corredera_fijo,
      marco_puerta,
      marcos_adicionales,
      comentario_marcos,
      otro,
      comentario_otro,
      valor_m2,
      m2_instalador,
      instalador,
      req.params.id
    ]);

    res.json({ message: 'Registro actualizado con éxito' });
  } catch (error) {
    console.error('Error al actualizar UTV:', error);
    res.status(500).json({ error: 'Error al actualizar UTV' });
  }
});

// DELETE /api/taller/utv/:id
router.delete('/utv/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM utv_taller WHERE id = $1', [id]);
    res.json({ message: 'Registro eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar UTV:', error);
    res.status(500).json({ error: 'Error al eliminar UTV' });
  }
});

/** =========================
 * Termopanel & Instalación: POST/DELETE
 * ========================= */

// 🔹 Agregar Termopanel
router.post('/termopanel', async (req, res) => {
  const {
    fecha,
    cliente,
    cantidad,
    ancho_mm,
    alto_mm,
    m2,
    observaciones,
    valor_m2
  } = req.body;

  try {
    await pool.query(`
      INSERT INTO termopanel_taller (
        fecha,
        cliente,
        cantidad,
        ancho_mm,
        alto_mm,
        m2,
        observaciones,
        valor_m2
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      fecha,
      cliente,
      cantidad,
      ancho_mm,
      alto_mm,
      m2,
      observaciones,
      valor_m2
    ]);

    res.status(201).json({ message: 'Registro de termopanel guardado correctamente' });
  } catch (error) {
    console.error('Error insertando Termopanel:', error);
    res.status(500).json({ error: 'Error al registrar termopanel' });
  }
});

// Eliminar registro termopanel
router.delete('/termopanel/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM termopanel_taller WHERE id = $1', [id]);
    res.json({ message: 'Registro eliminado' });
  } catch (error) {
    console.error('Error al eliminar registro termopanel:', error);
    res.status(500).json({ error: 'Error al eliminar registro' });
  }
});

// 🔹 Agregar Instalación
router.post('/instalacion', async (req, res) => {
  const { fecha, cliente, m2, observaciones, valor_m2 } = req.body;

  try {
    await pool.query(`
      INSERT INTO instalaciones_taller (
        fecha, cliente, m2, observaciones, valor_m2
      ) VALUES ($1, $2, $3, $4, $5)
    `, [fecha, cliente, m2, observaciones, valor_m2]);

    res.status(201).json({ message: 'Instalación registrada correctamente' });
  } catch (error) {
    console.error('Error insertando Instalación:', error);
    res.status(500).json({ error: 'Error al registrar instalación' });
  }
});

/** =========================
 * Consultas por mes/año (RANGO SEGURO)
 * ========================= */

// UTV por mes/año
router.get('/utv', async (req, res) => {
  try {
    const [inicio, fin] = boundsMes(req.query.mes, req.query.anio);
    const sql = `
      SELECT * 
      FROM utv_taller
      WHERE fecha >= $1::date
        AND fecha <  $2::date
      ORDER BY fecha DESC, id DESC;
    `;
    const resultado = await pool.query(sql, [inicio, fin]);
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error obteniendo UTV:', err);
    res.sendStatus(500);
  }
});

// Instalaciones por mes/año
router.get('/instalaciones', async (req, res) => {
  try {
    const [inicio, fin] = boundsMes(req.query.mes, req.query.anio);
    const sql = `
      SELECT *
      FROM instalaciones_taller
      WHERE fecha >= $1::date
        AND fecha <  $2::date
      ORDER BY fecha DESC, id DESC;
    `;
    const resultado = await pool.query(sql, [inicio, fin]);
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error obteniendo Instalaciones:', err);
    res.sendStatus(500);
  }
});

// Termopanel por mes/año
router.get('/termopanel', async (req, res) => {
  try {
    const [inicio, fin] = boundsMes(req.query.mes, req.query.anio);
    const sql = `
      SELECT *
      FROM termopanel_taller
      WHERE fecha >= $1::date
        AND fecha <  $2::date
      ORDER BY fecha DESC, id DESC;
    `;
    const result = await pool.query(sql, [inicio, fin]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener termopaneles:', error);
    res.status(500).json({ error: 'Error al obtener registros de termopanel' });
  }
});

/** =========================
 * Ruta base (legacy UTV): también segura
 * ========================= */

// Fechas (legacy) usando EXTRACT → lo cambiamos a rango seguro
router.get('/', async (req, res) => {
  try {
    const [inicio, fin] = boundsMes(req.query.mes, req.query.anio);
    const sql = `
      SELECT *
      FROM utv
      WHERE fecha >= $1::date
        AND fecha <  $2::date
      ORDER BY fecha DESC, id DESC;
    `;
    const resultado = await pool.query(sql, [inicio, fin]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener datos UTV:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** =========================
 * Campo instalador (UTV)
 * ========================= */
router.put('/utv/:id/instalador', async (req, res) => {
  const { instalador } = req.body;

  if (!instalador && instalador !== '') {
    return res.status(400).json({ error: 'Instalador es requerido' });
  }

  try {
    await pool.query(
      'UPDATE utv_taller SET instalador = $1 WHERE id = $2',
      [instalador, req.params.id]
    );
    res.json({ message: 'Instalador actualizado con éxito' });
  } catch (error) {
    console.error('Error al actualizar instalador:', error);
    res.status(500).json({ error: 'Error al actualizar instalador' });
  }
});

export default router;
