app.post('/api/items_presupuesto', async (req, res) => {
  const {
    presupuesto_id,
    item,
    recinto,
    ancho,
    alto,
    tipo_apertura,
    grada_buque,
    observaciones, // ahora es booleano
    texto_observaciones, // texto manual si está activo
    cantidad,
    precio_unitario,
    tipo_ventana,
    adicional, // nuevo booleano
    cuadros_adicionales // nuevo campo numérico
  } = req.body;

  // Cálculo de UTV
  let utv = 1;
  if (observaciones) {
    utv = 0; // entrada manual
  } else {
    const cuadros = parseFloat(cuadros_adicionales) || 0;
    utv = 1 + (0.5 * cuadros);
  }

  const valorUTV = 20000;
  const utv_monto = utv * valorUTV;
  const total = cantidad * precio_unitario;

  // Guardar respaldo JSON
  const jsonPath = './respaldo_items_presupuesto.json';
  let respaldo = [];

  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath);
    respaldo = JSON.parse(raw);
  }

  const nuevoItem = {
    presupuesto_id,
    item,
    recinto,
    ancho,
    alto,
    tipo_apertura,
    grada_buque,
    observaciones,
    texto_observaciones,
    cantidad,
    precio_unitario,
    total,
    tipo_ventana,
    adicional,
    cuadros_adicionales,
    utv,
    utv_monto
  };

  respaldo.push(nuevoItem);
  fs.writeFileSync(jsonPath, JSON.stringify(respaldo, null, 2));

  // Guardar en PostgreSQL
  try {
    const query = `
      INSERT INTO items_presupuesto (
        presupuesto_id, item, recinto, ancho, alto, tipo_apertura, grada_buque,
        observaciones, texto_observaciones, cantidad, precio_unitario, total,
        tipo_ventana, adicional, cuadros_adicionales, utv, utv_monto
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18
      ) RETURNING *;
    `;

    const values = [
      presupuesto_id,
      item,
      recinto,
      ancho,
      alto,
      tipo_apertura,
      grada_buque,
      observaciones,
      texto_observaciones,
      cantidad,
      precio_unitario,
      total,
      tipo_ventana,
      adicional,
      cuadros_adicionales,
      utv,
      utv_monto
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al guardar ítem presupuesto:', err.message);
    res.status(500).json({ error: 'Error al guardar en la base de datos' });
  }
});
