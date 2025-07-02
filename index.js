import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/presupuestos', (req, res) => {
  console.log('Presupuesto recibido:', req.body);
  res.json({ mensaje: 'Presupuesto guardado correctamente' });
});

app.listen(4000, () => {
  console.log('Servidor escuchando en http://localhost:4000');
});
