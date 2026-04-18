const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // increased for network reliability
});

// Test connection once
pool.query('SELECT NOW()')
  .then(result => {
    console.log('✅ Connected to PostgreSQL (Neon)');
    console.log('🕒 DB Time:', result.rows[0].now);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;