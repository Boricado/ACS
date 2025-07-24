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

  // Validación básica
  if (!cliente_id || !presupuesto_id || !numero_presupuesto || !codigo || !producto || !cantidad) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (!camposSeguimientoValidos.includes(campoSeguimiento)) {
    return res.status(400).json({ error: 'Campo de seguimiento no válido' });
  }

  try {
    // Insertar ítem en la tabla correspondiente
    await pool.query(
      `INSERT INTO ${tabla} (cliente_id, presupuesto_id, numero_presupuesto, codigo, producto, cantidad)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [cliente_id, presupuesto_id, numero_presupuesto, codigo, producto, cantidad]
    );

    // Actualizar el campo booleano correspondiente en seguimiento_obras
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

// Rutas POST por cada tipo de pauta
router.post('/perfiles', (req, res) => insertarYActualizar(req, res, 'ot_pautas_perfiles', 'perfiles'));
router.post('/refuerzos', (req, res) => insertarYActualizar(req, res, 'ot_pautas_refuerzos', 'refuerzos'));
router.post('/tornillos', (req, res) => insertarYActualizar(req, res, 'ot_pautas_tornillos', 'tornillos'));
router.post('/herraje', (req, res) => insertarYActualizar(req, res, 'ot_pautas_herraje', 'herraje'));
router.post('/accesorios', (req, res) => insertarYActualizar(req, res, 'ot_pautas_accesorios', 'accesorios'));
router.post('/gomascepillos', (req, res) => insertarYActualizar(req, res, 'ot_pautas_gomascepillos', 'gomas_cepillos'));
router.post('/vidrio', (req, res) => insertarYActualizar(req, res, 'ot_pautas_vidrio', 'vidrio'));
router.post('/instalacion', (req, res) => insertarYActualizar(req, res, 'ot_pautas_instalacion', 'instalacion'));

export default router;
