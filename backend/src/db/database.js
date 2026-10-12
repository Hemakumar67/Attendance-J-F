const { Pool } = require('pg');
const { newDb, DataType } = require('pg-mem');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

let dbPool = null;
let isInMemory = false;

async function getDbPool() {
  if (dbPool) return dbPool;

  const dbUrl = process.env.DATABASE_URL;
  console.log('dbUrl', dbUrl);
  if (dbUrl) {
    try {
      const pool = new Pool({ connectionString: dbUrl });
      await pool.query('SELECT 1');
      
      // Ensure tables exist on real PostgreSQL
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
      }

      dbPool = pool;
      isInMemory = false;
      console.log('✅ Connected to real PostgreSQL database successfully!');
      return dbPool;
    } catch (err) {
      console.warn('⚠️ PostgreSQL connection failed:', err.message);
      console.warn('Falling back to in-memory PG engine for local demo.');
    }
  }

  // Fallback: in-memory pg-mem database
  const db = newDb();

  const toCharImpl = (dateVal, fmt) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    if (fmt === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
    if (fmt === 'YYYY-MM') return `${yyyy}-${mm}`;
    return `${yyyy}-${mm}-${dd}`;
  };

  db.public.registerFunction({
    name: 'to_char',
    args: [DataType.date, DataType.text],
    returns: DataType.text,
    implementation: toCharImpl
  });

  db.public.registerFunction({
    name: 'to_char',
    args: [DataType.timestamp, DataType.text],
    returns: DataType.text,
    implementation: toCharImpl
  });

  db.public.registerFunction({
    name: 'to_char',
    args: [DataType.timestamptz, DataType.text],
    returns: DataType.text,
    implementation: toCharImpl
  });

  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool();
  dbPool = pool;
  isInMemory = true;

  // Run schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
  }

  return dbPool;
}

function isDbInMemory() {
  return isInMemory;
}

async function query(text, params) {
  const pool = await getDbPool();
  return pool.query(text, params);
}

module.exports = {
  getDbPool,
  isDbInMemory,
  query
};
