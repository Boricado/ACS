import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ASC',
  password: 'admin123',
  port: 5432,
});

export default pool;