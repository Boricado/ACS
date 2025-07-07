import bcrypt from 'bcryptjs';
import pg from 'pg';

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ASC',
  password: 'admin123',
  port: 5432,
});

const usuarios = [
  { nombre: 'Ventas', correo: 'jramos@alumce.cl', telefono: '', contrasena: 'AlumceVentas2025', rol: 'Ventas' },
  { nombre: 'Bodega', correo: 'bodega@alumce.cl', telefono: '', contrasena: 'AlumceBodega2025', rol: 'Bodega' },
  { nombre: 'Oficina Técnica', correo: 'oficinatecnica@alumce.cl', telefono: '', contrasena: 'AlumceOT2025', rol: 'Oficina Técnica' },
  { nombre: 'Adquisiciones', correo: 'adquisiciones@alumce.cl', telefono: '', contrasena: 'AlumceAdq2025', rol: 'Adquisiciones' },
  { nombre: 'Operaciones', correo: 'Operaciones@alumce.cl', telefono: '', contrasena: 'AlumceOP2025', rol: 'Operaciones' },
  { nombre: 'Secretaria', correo: 'secretaria@aluce.cl', telefono: '', contrasena: 'AlumceSecre2025', rol: 'Secretaria' },
  { nombre: 'Contabilidad', correo: 'pvenegas@alumce.cl', telefono: '', contrasena: 'AlumceC2025', rol: 'Contabilidad' },
  { nombre: 'Gerencia', correo: 'alumce@gmail.com', telefono: '', contrasena: 'Alumce2025', rol: 'Gerencia' },
  { nombre: 'Gerencia', correo: 'jparraguez@alumce.cl', telefono: '', contrasena: 'Alumce2025', rol: 'Gerencia' },
  { nombre: 'Fábrica', correo: 'jefetaller@alumce.cl', telefono: '', contrasena: 'AlumceFabrica2025', rol: 'Fábrica' },
  { nombre: 'Informático', correo: 'fidel.mora.aguirre@gmail.com', telefono: '', contrasena: 'AlumceIT2025', rol: 'Informático' },
];

const insertarUsuarios = async () => {
  for (const usuario of usuarios) {
    const hash = await bcrypt.hash(usuario.contrasena, 10);
    await pool.query(
      'INSERT INTO usuarios (nombre, correo, telefono, contrasena, rol) VALUES ($1, $2, $3, $4, $5)',
      [usuario.nombre, usuario.correo, usuario.telefono, hash, usuario.rol]
    );
    console.log(`Usuario ${usuario.correo} creado`);
  }
  await pool.end();
};

insertarUsuarios();
