const pg = require('pg');
require('dotenv').config();

const connectionString = 'postgresql://postgres.ivryzdwcegjdcbinvoms:Daniel@24419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'who_is_coming'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    
    const lastAppt = await pool.query(`
      SELECT id, who_is_coming FROM appointments ORDER BY id DESC LIMIT 1
    `);
    console.log('Last appointment:');
    console.log(JSON.stringify(lastAppt.rows, null, 2));
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
