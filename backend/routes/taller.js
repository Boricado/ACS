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
    fijo_mas_corredera // ✅ nueva columna
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
        fijo_mas_corredera
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16
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
      fijo_mas_corredera // ✅ nuevo valor
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
    valor_m2
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
        valor_m2 = $16
      WHERE id = $17
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
