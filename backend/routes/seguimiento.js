// PUT /api/seguimiento_obras/:id/rectificacion
router.put('/:id/rectificacion', async (req, res) => {
  const { id } = req.params;
  const { rectificacion, rectificacion_plazo_dias } = req.body;

  const nuevaFecha = rectificacion ? new Date().toISOString().split('T')[0] : null;

  try {
    await pool.query(
      `UPDATE seguimiento_obras
       SET rectificacion = $1,
           rectificacion_fecha = $2,
           rectificacion_plazo_dias = $3
       WHERE id = $4`,
      [rectificacion, nuevaFecha, rectificacion_plazo_dias, id]
    );
    res.status(200).json({ mensaje: 'Rectificación actualizada' });
  } catch (err) {
    console.error('Error al actualizar rectificación:', err);
    res.status(500).json({ error: 'Error al actualizar rectificación' });
  }
});
