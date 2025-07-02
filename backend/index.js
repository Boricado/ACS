import express from 'express';
import cors from 'cors';
import clienteRoutes from './routes/clientes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use(clienteRoutes);

app.listen(4000, () => {
  console.log('Servidor escuchando en http://localhost:4000');
});