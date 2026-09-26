import { Pool } from 'pg'
import 'dotenv/config';

const pool = new Pool({
  user: 'postgres',
  password: process.env.POSTGRES_PASSWORD?.toString(),
  host: 'localhost',
  port: 5432,
  database: 'maindb',
});

export default pool
