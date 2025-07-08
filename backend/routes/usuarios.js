// backend/routes/usuarios.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Conexión segura al Pool de Supabase (Render compatible)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;
  console.log("Intento de login:", correo);

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);

    if (result.rows.length === 0) {
      console.log("Usuario no encontrado");
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];
    console.log("Usuario encontrado:", usuario.nombre);

    if (!usuario.contrasena) {
      console.log("Contraseña no definida en BD");
      return res.status(500).json({ error: 'Contraseña no definida' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      console.log("Contraseña incorrecta");
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET || 'secreto',
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    console.log("Login exitoso para:", usuario.nombre);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (err) {
    console.error('Error en /api/login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
