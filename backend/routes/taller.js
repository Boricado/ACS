import express from 'express';
import pool from '../db.js';

const router = express.Router();

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

// PUT /api/taller/utv/:id/instalador
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

// Ruta: Obtener registros termopanel filtrados por mes/año
router.get('/termopanel', async (req, res) => {
  const { mes, anio } = req.query;

  try {
    const result = await pool.query(`
      SELECT * FROM termopanel_taller
      WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
      ORDER BY fecha DESC
    `, [mes, anio]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener termopaneles:', error);
    res.status(500).json({ error: 'Error al obtener registros de termopanel' });
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

// ==============================
// TRABAJADORES (CRUD con periodo)
// ==============================

// GET: listar (opcional ?periodo=YYYY-MM)
app.get('/api/trabajadores', async (req, res) => {
  try {
    const { periodo } = req.query;
    let q = `SELECT id, periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab
             FROM trabajadores`;
    const vals = [];
    if (periodo) {
      q += ` WHERE periodo = $1`;
      vals.push(periodo);
    }
    q += ` ORDER BY id ASC`;
    const r = await pool.query(q, vals);
    res.json(r.rows);
  } catch (err) {
    console.error('❌ GET /api/trabajadores', err.message);
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
});

// POST: crear
app.post('/api/trabajadores', async (req, res) => {
  const {
    periodo,
    nombre,
    dias_trab = 0,
    horas_trab = 0,
    horas_extras = 0,
    horas_retraso = 0,
    observacion = '',
    horas_acum_trab = 0
  } = req.body;

  try {
    const q = `
      INSERT INTO trabajadores (periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id, periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab
    `;
    const v = [
      periodo || new Date().toISOString().slice(0, 7),
      nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab
    ];
    const r = await pool.query(q, v);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('❌ POST /api/trabajadores', err.message);
    res.status(500).json({ error: 'Error al crear trabajador' });
  }
});

// PUT: actualizar
app.put('/api/trabajadores/:id', async (req, res) => {
  const { id } = req.params;
  const {
    periodo,
    nombre,
    dias_trab = 0,
    horas_trab = 0,
    horas_extras = 0,
    horas_retraso = 0,
    observacion = '',
    horas_acum_trab = 0
  } = req.body;

  try {
    const q = `
      UPDATE trabajadores
      SET periodo=$1, nombre=$2, dias_trab=$3, horas_trab=$4, horas_extras=$5, horas_retraso=$6, observacion=$7, horas_acum_trab=$8
      WHERE id=$9
      RETURNING id, periodo, nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab
    `;
    const v = [periodo || new Date().toISOString().slice(0, 7), nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab, id];
    const r = await pool.query(q, v);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('❌ PUT /api/trabajadores/:id', err.message);
    res.status(500).json({ error: 'Error al actualizar trabajador' });
  }
});

// DELETE: borrar
app.delete('/api/trabajadores/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const r = await pool.query('DELETE FROM trabajadores WHERE id=$1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json({ message: 'Trabajador eliminado' });
  } catch (err) {
    console.error('❌ DELETE /api/trabajadores/:id', err.message);
    res.status(500).json({ error: 'Error al eliminar trabajador' });
  }
});


export default router;
